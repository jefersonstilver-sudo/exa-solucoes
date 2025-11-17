import React, { useState, useEffect } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Clock } from 'lucide-react';

export const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const { screenSize, isMobile, isTablet } = useResponsiveLayout();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Cálculo dinâmico baseado na tela
  const scaleFactor = Math.min(screenSize.width / 1920, 1);
  const minScale = isMobile ? 0.6 : isTablet ? 0.75 : 0.85;
  const finalScale = Math.max(scaleFactor, minScale);

  const sizes = {
    clockFontSize: `clamp(1.5rem, ${finalScale * 4}rem, 5rem)`,
    dateFontSize: `clamp(0.625rem, ${finalScale * 0.875}rem, 1rem)`,
    padding: `clamp(0.5rem, ${finalScale * 1.5}rem, 2rem)`,
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border border-white/5 h-full w-full overflow-hidden">
      <div className="h-full flex flex-col justify-center items-center" style={{ padding: sizes.padding }}>
        {/* Header com ícone */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Clock className="text-red-400 flex-shrink-0" style={{ width: finalScale * 32, height: finalScale * 32 }} />
          <div 
            className="text-white/50 font-medium uppercase tracking-wider"
            style={{ fontSize: `clamp(0.625rem, ${finalScale * 0.875}rem, 1rem)` }}
          >
            Horário
          </div>
        </div>

        {/* Relógio - Centralizado */}
        <div 
          className="font-bold text-white tracking-tight font-mono leading-none mb-2 text-center"
          style={{ fontSize: sizes.clockFontSize }}
        >
          {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        {/* Data completa */}
        <div 
          className="text-white/70 font-medium capitalize text-center"
          style={{ fontSize: sizes.dateFontSize }}
        >
          {time.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long',
            year: 'numeric' 
          })}
        </div>
      </div>
    </div>
  );
};
