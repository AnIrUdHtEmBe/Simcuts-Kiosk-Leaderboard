import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_URL, WEBRTC_URL_BASE } from './constants';
import { WebRTCPlayer } from './components/WebRTCPlayer';
import { DynamicBottomWidget } from './components/DynamicBottomWidget';
import { QRCodeBox } from './components/QRCodeBox';
import { LeaderboardVideoWidget } from './components/LeaderboardVideoWidget';
import headerLogo from './assets/header-logo.svg';
import finalLogo from './assets/FinalLogo.png';
import locoLogo from './assets/loco-logo.png';

function App() {
  const [isLive1, setIsLive1] = useState(false);
  const [isLive2, setIsLive2] = useState(false);
  const [isStreamPlaying1, setIsStreamPlaying1] = useState(false);
  const [isStreamPlaying2, setIsStreamPlaying2] = useState(false);
  const [trackOfTheMonth, setTrackOfTheMonth] = useState('');

  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const res1 = await axios.get(`${API_URL}/api/operator/sim/1/active`);
        setIsLive1(res1.data.status === 'RECORDING');
      } catch (e) {
        setIsLive1(false);
      }
      try {
        const res2 = await axios.get(`${API_URL}/api/operator/sim/2/active`);
        setIsLive2(res2.data.status === 'RECORDING');
      } catch (e) {
        setIsLive2(false);
      }
    };
    checkLiveStatus();
    const liveStatusInt = setInterval(checkLiveStatus, 5000);
    
    // Subscribe to websocket for instant live stream state
    const socket = io(API_URL);
    socket.on('ride_recording', (ride: any) => {
        if (ride.sim_number === 1) setIsLive1(true);
        if (ride.sim_number === 2) setIsLive2(true);
    });
    
    socket.on('ride_processing', (ride: any) => {
        if (ride.sim_number === 1) setIsLive1(false);
        if (ride.sim_number === 2) setIsLive2(false);
    });
    
    const fetchConfigs = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/configs`);
        setTrackOfTheMonth(res.data.track_of_the_month || '');
      } catch (e) {}
    };
    fetchConfigs();
    const configInt = setInterval(fetchConfigs, 60000);

    return () => {
      socket.disconnect();
      clearInterval(configInt);
      clearInterval(liveStatusInt);
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-surface overflow-hidden flex flex-col p-4 relative">
      
      {/* Header with Logos */}
      <div className="h-6 mb-4 shrink-0 flex items-center justify-between">
        <img src={headerLogo} alt="Header Logo" className="h-full object-contain" />
        <img 
          src={import.meta.env.VITE_CLIENT === 'playarena' ? finalLogo : locoLogo} 
          alt="Final Logo" 
          className="h-full object-contain" 
        />
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
        
        {/* Top Row */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Top Left: Sim 1 */}
          <div className="flex-1 bg-card rounded-2xl overflow-hidden border border-border relative shadow-2xl flex flex-col">
            {/* We ALWAYS mount HlsPlayer if isLive1 is true, but we hide it visually if it's not actually playing yet */}
            {isLive1 && (
              <div className={isStreamPlaying1 ? "w-full h-full relative" : "hidden"}>
                <div className="absolute top-2 right-2 z-50 bg-brand/90 px-3 py-1 rounded-full border border-red-500/50 shadow-lg backdrop-blur-sm">
                  <span className="text-white font-black text-xs tracking-widest uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE SIM 1
                  </span>
                </div>
                <WebRTCPlayer 
                  streamUrl={`${WEBRTC_URL_BASE}/sim1/stream/whep`} 
                  isLive={isLive1} 
                  onSuccess={() => setIsStreamPlaying1(true)}
                  onError={() => setIsStreamPlaying1(false)}
                />
              </div>
            )}

            {(!isLive1 || !isStreamPlaying1) && (
              <LeaderboardVideoWidget type="weekly" simLabel="SIM 1" />
            )}
          </div>

          {/* Top Right: Sim 2 */}
          <div className="flex-1 bg-card rounded-2xl overflow-hidden border border-border relative shadow-2xl flex flex-col">
            {isLive2 && (
              <div className={isStreamPlaying2 ? "w-full h-full relative" : "hidden"}>
                <div className="absolute top-2 right-2 z-50 bg-brand/90 px-3 py-1 rounded-full border border-red-500/50 shadow-lg backdrop-blur-sm">
                  <span className="text-white font-black text-xs tracking-widest uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE SIM 2
                  </span>
                </div>
                <WebRTCPlayer 
                  streamUrl={`${WEBRTC_URL_BASE}/sim2/stream/whep`} 
                  isLive={isLive2} 
                  onSuccess={() => setIsStreamPlaying2(true)}
                  onError={() => setIsStreamPlaying2(false)}
                />
              </div>
            )}

            {(!isLive2 || !isStreamPlaying2) && (
              <LeaderboardVideoWidget type="monthly" simLabel="SIM 2" />
            )}
          </div>
        </div>

        {/* Centered QR Code Band */}
        <div className="shrink-0 z-50 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <QRCodeBox trackOfTheMonth={trackOfTheMonth} />
        </div>

        {/* Bottom Row */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Bottom Left: Weekly Leaderboard or Sim 1 Recent */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col bg-card">
            <DynamicBottomWidget simNumber={1} leaderboardType="weekly" />
          </div>

          {/* Bottom Right: Monthly Leaderboard or Sim 2 Recent */}
          <div className="flex-1 rounded-2xl overflow-hidden border border-border shadow-2xl flex flex-col bg-card">
            <DynamicBottomWidget simNumber={2} leaderboardType="monthly" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
