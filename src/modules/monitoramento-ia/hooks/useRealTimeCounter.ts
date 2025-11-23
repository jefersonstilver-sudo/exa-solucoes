import { useState, useEffect } from 'react';

/**
 * Hook para contador em tempo real de quanto tempo um dispositivo está offline
 * Atualiza a cada segundo
 */
export const useRealTimeCounter = (lastOnlineDate: string | null) => {
  const [elapsed, setElapsed] = useState<string>('');

  useEffect(() => {
    if (!lastOnlineDate) {
      setElapsed('Sem informação');
      return;
    }

    const calculateElapsed = () => {
      const now = Date.now();
      const lastOnline = new Date(lastOnlineDate).getTime();
      const diff = now - lastOnline;

      if (diff < 0) {
        setElapsed('Agora');
        return;
      }

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        setElapsed(`${days}d ${hours % 24}h`);
      } else if (hours > 0) {
        setElapsed(`${hours}h ${minutes % 60}m`);
      } else if (minutes > 0) {
        setElapsed(`${minutes}m ${seconds % 60}s`);
      } else {
        setElapsed(`${seconds}s`);
      }
    };

    // Calcular imediatamente
    calculateElapsed();

    // Atualizar a cada segundo
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [lastOnlineDate]);

  return elapsed;
};
