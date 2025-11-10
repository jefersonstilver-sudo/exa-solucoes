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
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/5 p-4 h-full flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-10 h-10 bg-red-500/10 rounded-full border border-red-500/20 flex-shrink-0">
          <Clock className="h-5 w-5 text-red-400" />
        </div>
        <div className="text-xs text-white/50 font-medium uppercase tracking-wider">
          Horário
        </div>
      </div>
      <div className="text-5xl font-bold text-white tracking-tight font-mono leading-none mb-2">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-sm text-white/70 font-medium capitalize">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace('de ', 'De ')}
      </div>
    </div>
  );
};
