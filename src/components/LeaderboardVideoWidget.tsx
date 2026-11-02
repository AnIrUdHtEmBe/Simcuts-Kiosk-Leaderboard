import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL } from "../constants";
import { getCachedVideo, cacheVideoBlob } from "../utils/videoCache";

interface Props {
  type: "weekly" | "monthly";
  simLabel: string;
}

const formatTime = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${millis.toString().padStart(3, "0")}`;
};

export const LeaderboardVideoWidget: React.FC<Props> = ({ type, simLabel }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [rideDetails, setRideDetails] = useState<any | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastRideSig = useRef<string | null>(null);
  const isDownloading = useRef<boolean>(false);
  void simLabel;

  useEffect(() => {
    const fetchTopRide = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/leaderboard/${type}`);
        const validRides = (res.data || []).filter((r: any) =>
          r.best_lap_time_ms &&
          r.best_lap_time_ms > 0 &&
          r.best_lap_time !== "00:00:000" &&
          r.best_lap_time !== "0:00.000" &&
          r.best_lap_time !== ""
        );
        if (validRides && validRides.length > 0) {
          const bestRide = validRides[0]; // Top 1
          if (bestRide.s3_link) {
            const sig = `${bestRide.gamer_tag}-${bestRide.best_lap_time_ms}`;
            if (lastRideSig.current !== sig) {
              lastRideSig.current = sig;
              setRideDetails(bestRide);
              
              // 1. Check if we already have this specific video cached
              const cached = await getCachedVideo(type);
              if (cached && cached.signature === sig) {
                // Serve from cache
                const objectUrl = URL.createObjectURL(cached.blob);
                setVideoUrl(objectUrl);
              } else {
                // Determine local URL
                const filename = bestRide.s3_link.split('/').pop();
                const localVideoUrl = `${API_URL}/videos/${filename}`;
                
                // 2. Play from local network immediately
                setVideoUrl(localVideoUrl);
                
                // 3. Download in the background and cache it (from local server!)
                if (!isDownloading.current) {
                  isDownloading.current = true;
                  try {
                    const blobRes = await axios.get(localVideoUrl, { responseType: 'blob' });
                    // 'put' overwrites the existing entry for the 'type' key automatically (acts as cleanup)
                    await cacheVideoBlob(type, sig, blobRes.data);
                    
                    // Swap the URL to the local blob so the NEXT loop plays from cache without network
                    const objectUrl = URL.createObjectURL(blobRes.data);
                    setVideoUrl(objectUrl);
                  } catch (downloadErr) {
                    console.error("Background download failed:", downloadErr);
                  } finally {
                    isDownloading.current = false;
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchTopRide();
    const interval = setInterval(fetchTopRide, 30000);
    return () => clearInterval(interval);
  }, [type]);

  // Clean up object URLs when component unmounts or videoUrl changes
  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current
        .play()
        .catch((e) => console.log("Autoplay prevented:", e));
    }
  }, [videoUrl]);

  if (!videoUrl) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center">
        <p className="text-white opacity-50">
          No {type} leaderboard video yet.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black overflow-hidden flex justify-center items-center">
      <div className="absolute top-1 right-1 z-50 bg-black/80 px-2 py-1 rounded-md border border-yellow-500 shadow-md backdrop-blur-md flex flex-col items-end">
        <span className="text-yellow-500 font-black text-[8px] tracking-widest uppercase leading-none mb-0.5">
          BEST OF {type === "weekly" ? "WEEK" : "MONTH"}
        </span>
        <span className="text-white text-[9px] font-bold leading-none">
          {rideDetails?.gamer_tag || "Anonymous"}{" "}
          <span className="text-yellow-400 ml-1">
            {rideDetails?.best_lap_time_ms
              ? formatTime(rideDetails.best_lap_time_ms)
              : "00:00:000"}
          </span>
        </span>
      </div>
      <video
        key={renderKey}
        ref={videoRef}
        src={videoUrl}
        style={{ width: "calc(100% + 300px)", maxWidth: "none" }}
        className="h-full object-contain absolute z-0"
        autoPlay
        muted
        playsInline
        onTimeUpdate={(e) => {
          if (e.currentTarget.currentTime >= 90) {
            setRenderKey((prev) => prev + 1);
          }
        }}
        onEnded={() => {
          // Completely unmount and remount the video to prevent memory leaks/freezing on loop
          setRenderKey((prev) => prev + 1);
        }}
      />
    </div>
  );
};
