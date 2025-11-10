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
      <div className="h-full flex flex-col justify-center p-3 sm:p-4 md:p-5 lg:p-6">
        {/* Header com ícone */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-500/10 rounded-full border border-red-500/20 flex-shrink-0">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
          </div>
          <div className="text-xs sm:text-sm text-white/50 font-medium uppercase tracking-wider">
            Horário
          </div>
        </div>

        {/* Relógio - tamanho responsivo */}
        <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white tracking-tight font-mono leading-none mb-2 sm:mb-3">
          {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        {/* Data completa - responsiva */}
        <div className="text-xs sm:text-sm md:text-base text-white/70 font-medium capitalize">
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
