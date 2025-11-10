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
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/5 p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-full border border-red-500/20">
          <Clock className="h-6 w-6 text-red-400" />
        </div>
        <div className="flex-1">
          <div className="text-3xl md:text-4xl font-bold text-white tracking-tight font-mono">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-sm text-white/60 font-medium capitalize">
            {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};
