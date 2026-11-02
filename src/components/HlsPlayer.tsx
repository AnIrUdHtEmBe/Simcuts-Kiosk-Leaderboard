import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface HlsPlayerProps {
  streamUrl: string;
  isLive: boolean;
  onError?: () => void;
  onSuccess?: () => void;
}

export const HlsPlayer: React.FC<HlsPlayerProps> = ({ streamUrl, isLive, onError, onSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    let hls: Hls | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const initPlayer = () => {
      if (!isMounted) return;
      if (Hls.isSupported() && isLive) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 3,
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => console.log("Autoplay prevented: ", e));
          setHasError(false);
          if (onSuccess) onSuccess();
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
             setHasError(true);
             if (onError) onError();
             retryTimeout = setTimeout(() => {
                 if (hls) hls.destroy();
                 initPlayer();
             }, 2000);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl') && isLive) {
        video.src = streamUrl;
        
        const onLoaded = () => {
          video.play().catch(e => console.log("Autoplay prevented: ", e));
          setHasError(false);
          if (onSuccess) onSuccess();
        };
        const onErr = () => {
          setHasError(true);
          if (onError) onError();
          retryTimeout = setTimeout(() => {
             initPlayer();
          }, 2000);
        };

        video.addEventListener('loadedmetadata', onLoaded);
        video.addEventListener('error', onErr);
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      clearTimeout(retryTimeout);
      if (hls) hls.destroy();
    };
  }, [streamUrl, isLive]);

  return (
    <div className="w-full h-full relative bg-black overflow-hidden flex justify-center items-center">
      {(hasError || !isLive) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <p className="text-white opacity-50">Stream Offline</p>
        </div>
      )}
      <video
        ref={videoRef}
        style={{ width: 'calc(100% + 30px)', maxWidth: 'none' }}
        className={`h-full object-contain absolute z-10 ${(hasError || !isLive) ? 'invisible' : 'visible'}`}
        muted
        autoPlay
        playsInline
      />
    </div>
  );
};
