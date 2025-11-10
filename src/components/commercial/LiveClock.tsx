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
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/5 p-6 h-full flex items-center">
      <div className="flex items-center gap-4 w-full">
        <div className="flex items-center justify-center w-14 h-14 bg-red-500/10 rounded-full border border-red-500/20 flex-shrink-0">
          <Clock className="h-7 w-7 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-4xl md:text-5xl font-bold text-white tracking-tight font-mono leading-tight">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-sm md:text-base text-white/70 font-medium capitalize mt-1">
            {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace('de ', 'De ')}
          </div>
        </div>
      </div>
    </div>
  );
};
