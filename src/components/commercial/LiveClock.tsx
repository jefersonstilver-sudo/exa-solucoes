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
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-4 md:p-6">
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-red-500/20 rounded-full border-2 border-red-500/30">
          <Clock className="h-7 w-7 md:h-8 md:w-8 text-red-400" />
        </div>
        <div className="flex-1">
          <div className="text-4xl md:text-6xl font-bold text-white tracking-tight font-mono">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-base md:text-lg text-white/70 font-medium mt-1 capitalize">
            {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};
