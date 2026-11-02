import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

export const RecentRidesWidget: React.FC = () => {
  const [rides, setRides] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent COMPLETED rides (with s3_link)
        const res = await axios.get(`${API_URL}/api/rides/location/BLR_01`);
        const completed = res.data.filter((r: any) => r.status === 'COMPLETED' && r.s3_link).slice(0, 5);
        setRides(completed);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-card flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider">
          Recent Rides
        </h2>
        <div className="w-12 h-1 bg-brand rounded-full" />
      </div>
      <div className="flex-1 flex flex-col space-y-4">
        <AnimatePresence>
          {rides.map((r, i) => (
            <motion.div
              key={r.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-md"
            >
              {/* We can play a muted preview if we want, or just show snapshot/code */}
              {r.s3_link ? (
                <video
                  src={`${API_URL}/videos/${r.s3_link.split('/').pop()}`}
                  className="w-24 h-16 object-cover rounded-lg border border-border"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <div className="w-24 h-16 bg-card rounded-lg border border-border flex items-center justify-center">
                  <span className="text-xs text-text-muted">No Preview</span>
                </div>
              )}
              <div>
                <p className="font-bold text-white text-lg">{r.gamer_tag || 'Anonymous'}</p>
                <p className="text-xs font-mono text-brand">Code: {r.code}</p>
              </div>
            </motion.div>
          ))}
          {rides.length === 0 && (
            <div className="text-center text-text-muted py-8 font-semibold">
              No recent rides.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
