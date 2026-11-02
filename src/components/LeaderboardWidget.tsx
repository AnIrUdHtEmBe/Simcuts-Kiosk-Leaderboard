import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardWidgetProps {
  type: 'weekly' | 'monthly';
}

const formatTime = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${millis.toString().padStart(3, '0')}`;
};

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ type }) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/leaderboard/${type}`);
        const validRides = (res.data || []).filter((r: any) =>
          r.best_lap_time_ms &&
          r.best_lap_time_ms > 0 &&
          r.best_lap_time !== "00:00:000" &&
          r.best_lap_time !== "0:00.000" &&
          r.best_lap_time !== ""
        );
        setData(validRides.slice(0, 10)); // Top 10
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [type]);

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-300 text-black border-none';
      case 1:
        return 'bg-gradient-to-r from-gray-400 to-gray-200 text-black border-none';
      case 2:
        return 'bg-gradient-to-r from-orange-600 to-orange-400 text-black border-none';
      default:
        return 'bg-transparent border border-gray-600 text-white';
    }
  };

  return (
    <div className="w-full h-full bg-[#111] flex flex-col p-1 sm:p-2 relative overflow-hidden">
      
      {/* Title */}
      <div className="flex items-center justify-between gap-2 mb-2 w-full shrink-0 px-2">
        <div className="flex flex-col gap-1 w-4 sm:w-6 lg:w-8 shrink-0">
          <div className="h-1 bg-yellow-400 w-full rounded-full"></div>
          <div className="h-1 bg-yellow-400 w-full rounded-full"></div>
          <div className="h-1 bg-yellow-400 w-full rounded-full"></div>
        </div>
        <h2 className="text-xs sm:text-sm lg:text-base font-black text-white uppercase tracking-widest text-center flex-1 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {type === 'weekly' ? 'WEEKLY ' : 'MONTHLY '}LEADERBOARD
        </h2>
        <div className="flex flex-col gap-1 w-4 sm:w-6 lg:w-8 items-end shrink-0">
          <div className="h-1 bg-[#00E5FF] w-full rounded-full"></div>
          <div className="h-1 bg-[#00E5FF] w-full rounded-full"></div>
          <div className="h-1 bg-[#00E5FF] w-full rounded-full"></div>
        </div>
      </div>

      {/* Headers */}
      <div className="flex items-center justify-between px-10 mb-0.5 shrink-0">
        <span className="text-yellow-400 font-black tracking-widest text-xs sm:text-sm">NAME</span>
        <span className="text-yellow-400 font-black tracking-widest text-xs sm:text-sm">SCORE</span>
      </div>

      <div className="flex-1 flex flex-col justify-start space-y-1 overflow-y-hidden pr-1">
        <AnimatePresence>
          {data.map((r, i) => (
            <motion.div
              key={r.code || i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between py-1.5 px-3 rounded-r-xl rounded-l-md ${getRankStyle(i)} shadow-sm`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm sm:text-base font-black w-6 text-center">
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold text-xs sm:text-sm leading-tight uppercase tracking-wide truncate max-w-[140px] sm:max-w-[200px]">{r.gamer_tag || 'Anonymous'}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-bold text-xs sm:text-sm">
                  {formatTime(r.best_lap_time_ms)}
                </p>
              </div>
            </motion.div>
          ))}
          {data.length === 0 && (
            <div className="text-center text-gray-500 py-8 font-semibold">
              No rides recorded yet.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
