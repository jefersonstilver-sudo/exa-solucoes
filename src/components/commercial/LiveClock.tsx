import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border border-white/5 h-full w-full overflow-hidden">
      <div className="h-full flex flex-col justify-center p-2 sm:p-3 md:p-4 lg:p-6">
        {/* Header com ícone */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-red-500/10 rounded-full border border-red-500/20 flex-shrink-0">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
          </div>
          <div className="text-[10px] sm:text-xs text-white/50 font-medium uppercase tracking-wider">
            Horário
          </div>
        </div>

        {/* Relógio - tamanho responsivo */}
        <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight font-mono leading-none mb-1.5 sm:mb-2">
          {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        {/* Data completa - responsiva */}
        <div className="text-[10px] sm:text-xs md:text-sm text-white/70 font-medium capitalize truncate">
          {time.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long',
            year: 'numeric' 
          }).replace('de ', 'De ')}
        </div>
      </div>
    </div>
  );
};
