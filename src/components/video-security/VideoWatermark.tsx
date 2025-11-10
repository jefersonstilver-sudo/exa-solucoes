import React from 'react';
import exaLogo from '@/assets/exa-logo.png';

interface VideoWatermarkProps {
  className?: string;
}

export const VideoWatermark: React.FC<VideoWatermarkProps> = ({ className = '' }) => {
  return (
    <>
      {/* Marca d'água fixa no centro - mais sutil e menor */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
        <img
          src={exaLogo}
          alt="EXA"
          className="h-24 w-auto opacity-10 select-none"
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Grade de proteção invisível - dificulta capturas */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.005] to-transparent" />
      </div>
    </>
  );
};
