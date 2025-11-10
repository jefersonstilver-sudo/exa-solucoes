import React, { useEffect, useState } from 'react';
import exaLogo from '@/assets/exa-logo.png';

interface VideoWatermarkProps {
  className?: string;
}

export const VideoWatermark: React.FC<VideoWatermarkProps> = ({ className = '' }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });

  // Mover marca d'água aleatoriamente para dificultar remoção por crop
  useEffect(() => {
    const moveWatermark = () => {
      const maxX = window.innerWidth * 0.8;
      const maxY = window.innerHeight * 0.8;
      
      setPosition({
        x: Math.random() * maxX,
        y: Math.random() * maxY
      });
    };

    const interval = setInterval(moveWatermark, 8000); // Move a cada 8 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Marca d'água principal - semi-transparente */}
      <div
        className={`absolute z-50 pointer-events-none transition-all duration-1000 ${className}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 blur-md bg-white/10" />
          
          {/* Logo */}
          <img
            src={exaLogo}
            alt="EXA"
            className="h-16 w-auto opacity-40 select-none"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
          
          {/* Texto proteção */}
          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <p className="text-white/30 text-xs font-bold tracking-widest select-none whitespace-nowrap">
              PROTEGIDO © EXA MÍDIA
            </p>
          </div>
        </div>
      </div>

      {/* Marca d'água fixa no centro - bem sutil */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
        <img
          src={exaLogo}
          alt="EXA"
          className="h-32 w-auto opacity-15 select-none"
          draggable="false"
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      {/* Grade de proteção invisível - dificulta capturas */}
      <div className="absolute inset-0 pointer-events-none z-30">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.01] to-transparent" />
      </div>
    </>
  );
};
