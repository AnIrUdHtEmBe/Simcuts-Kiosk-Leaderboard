import React from 'react';
import qrImage from '../assets/qr.jpeg';

interface Props {
  trackOfTheMonth?: string;
}

export const QRCodeBox: React.FC<Props> = ({ trackOfTheMonth }) => {
  return (
    <div className="w-full bg-black flex flex-row items-center justify-center p-6 gap-12 text-center shadow-xl border-y-2 border-yellow-500">
      <div className="bg-white p-3 rounded-xl shadow-lg shrink-0">
        <img src={qrImage} alt="QR Code" className="w-32 h-32 object-cover" />
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-4xl font-black text-yellow-500 uppercase tracking-widest mb-2 shadow-sm">Claim Your Ride</h2>
        <p className="text-yellow-500/90 font-semibold text-xl max-w-md mx-auto mb-2">
          Scan this QR code for your ride video!
        </p>
        {trackOfTheMonth && (
          <div className="inline-block bg-yellow-500/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-yellow-500/30 text-yellow-500 font-bold tracking-wide">
            Track of the Month: <span className="text-yellow-300">{trackOfTheMonth}</span>
          </div>
        )}
      </div>
    </div>
  );
};
