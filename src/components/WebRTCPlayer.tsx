import React from "react";

interface WebRTCPlayerProps {
  streamUrl: string;
  isLive: boolean;
  onError?: () => void;
  onSuccess?: () => void;
}

export const WebRTCPlayer: React.FC<WebRTCPlayerProps> = ({
  streamUrl,
  isLive,
  onError,
  onSuccess,
}) => {
  // Convert WHEP API url (e.g. http://ip:8889/sim2/stream/whep) to the MediaMTX player URL (e.g. http://ip:8889/sim2/stream/)
  const playerUrl = streamUrl.replace(/\/whep$/, "/");

  return (
    <div className="w-full h-full relative bg-black overflow-hidden flex justify-center items-center pointer-events-none">
      {!isLive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <p className="text-white opacity-50">Stream Offline</p>
        </div>
      )}
      {isLive && (
        <iframe
          src={playerUrl}
          className="absolute inset-0 w-full h-full border-0 outline-none z-10"
          style={{ width: "100%", height: "100%" }}
          allow="autoplay; fullscreen"
          onLoad={() => {
            if (onSuccess) onSuccess();
          }}
          onError={() => {
            if (onError) onError();
          }}
        />
      )}
    </div>
  );
};
