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
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 p-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full border-2 border-red-500/30">
          <Clock className="h-8 w-8 text-red-400" />
        </div>
        <div className="flex-1">
          <div className="text-5xl md:text-6xl font-bold text-white tracking-tight font-mono">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-lg text-white/60 font-medium mt-1 capitalize">
            {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};
