import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_URL } from '../constants';
import { LeaderboardWidget } from './LeaderboardWidget';

interface Props {
  simNumber: number;
  leaderboardType: 'weekly' | 'monthly';
}

const formatTime = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${millis.toString().padStart(3, "0")}`;
};

export const DynamicBottomWidget: React.FC<Props> = ({ simNumber, leaderboardType }) => {
  const [recentRide, setRecentRide] = useState<any | null>(null);
  const [showOutro, setShowOutro] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const lastPlayedRideRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (recentRide) {
      setShowOutro(false);
    }
  }, [recentRide]);

  useEffect(() => {
    if (showOutro) {
      const timer = setTimeout(() => {
        setShowOutro(false);
        setRecentRide(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showOutro]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.currentTime >= 90 && !showOutro) {
      video.pause();
      setShowOutro(true);
    }
  };

  const handleEnded = () => {
    if (!showOutro) {
      setShowOutro(true);
    }
  };

  useEffect(() => {
    // Function to check if a ride is recent (within 3 mins)
    const checkAndSetRecent = (ride: any) => {
       if (ride.sim_number === simNumber && ride.status === 'COMPLETED' && ride.s3_link) {
         if (lastPlayedRideRef.current === ride.code) {
           return; // Prevent playing the same ride again
         }
         const now = Date.now() / 1000;
         const completedAt = ride.completed_at || now;
         if ((now - completedAt) < 180) {
           lastPlayedRideRef.current = ride.code;
           setRecentRide(ride);
         }
       }
    };

    const fetchRecent = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/rides/location/BLR_01`);
        const completed = res.data.filter((r: any) => r.status === 'COMPLETED' && r.s3_link && r.sim_number === simNumber);
        if (completed.length > 0) {
          checkAndSetRecent(completed[0]);
        } else {
          setRecentRide(null);
        }
      } catch (e) {
        console.error(e);
      }
    };

    // Initial fetch
    fetchRecent();
    
    // Fallback polling: if browser tab is backgrounded and misses a websocket event,
    // this ensures it will still pick up the recent ride within 15 seconds.
    const fallbackInterval = setInterval(fetchRecent, 15000);

    // WebSocket connection
    const socket = io(API_URL, { transports: ['websocket'] });
    socket.on('ride_completed', (ride: any) => {
      checkAndSetRecent(ride);
    });

    return () => {
      clearInterval(fallbackInterval);
      socket.disconnect();
    };
  }, [simNumber]);

  useEffect(() => {
    if (videoRef.current && recentRide?.s3_link) {
      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }
  }, [recentRide?.s3_link]);

  if (recentRide) {
    const displayDuration = recentRide.total_time_ms || recentRide.best_lap_time_ms;
    return (
      <div className="w-full h-full bg-black relative overflow-hidden flex justify-center items-center">
        {!showOutro && (
          <div className="absolute top-1 right-1 z-50 bg-black/80 px-2 py-1 rounded-md border border-yellow-500 shadow-md backdrop-blur-md flex flex-col items-end">
            <span className="text-yellow-500 font-black text-[8px] tracking-widest uppercase leading-none mb-0.5">
              SIM {simNumber} RECENT RIDE
            </span>
            <span className="text-white text-[9px] font-bold leading-none">
              {recentRide.gamer_tag || 'Anonymous'}{" "}
              <span className="text-yellow-400 ml-1">
                {recentRide.best_lap_time_ms
                  ? formatTime(recentRide.best_lap_time_ms)
                  : "00:00:000"}
              </span>
            </span>
          </div>
        )}
        
        {showOutro ? (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-center p-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-white mb-4 tracking-wider uppercase">
              Thank You For Your Ride!
            </h2>
            <p className="text-xl text-yellow-400 font-bold">
              Total Duration: {displayDuration ? formatTime(displayDuration) : "00:00:000"}
            </p>
          </div>
        ) : (
          <video 
            ref={videoRef}
            src={recentRide.s3_link} 
            style={{ width: 'calc(100% + 300px)', maxWidth: 'none' }}
            className="h-full object-contain absolute z-0" 
            autoPlay 
            muted 
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        )}
      </div>
    );
  }

  return <LeaderboardWidget type={leaderboardType} />;
};
