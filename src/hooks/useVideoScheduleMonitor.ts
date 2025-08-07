import { useEffect, useRef } from 'react';
import { videoScheduleService } from '@/services/videoScheduleService';

interface UseVideoScheduleMonitorProps {
  orderId: string;
  enabled?: boolean;
  intervalMinutes?: number;
}

export const useVideoScheduleMonitor = ({ 
  orderId, 
  enabled = true, 
  intervalMinutes = 1 
}: UseVideoScheduleMonitorProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !orderId) {
      return;
    }

    console.log('🕐 [SCHEDULE_MONITOR] Iniciando monitoramento automático:', {
      orderId,
      intervalMinutes
    });

    // Executar imediatamente na primeira vez
    videoScheduleService.updateAllVideosForOrder(orderId);

    // Configurar intervalo para verificação contínua
    intervalRef.current = setInterval(() => {
      console.log('⏰ [SCHEDULE_MONITOR] Executando verificação periódica');
      videoScheduleService.updateAllVideosForOrder(orderId);
    }, intervalMinutes * 60 * 1000); // Converter minutos para milissegundos

    // Cleanup
    return () => {
      if (intervalRef.current) {
        console.log('🛑 [SCHEDULE_MONITOR] Parando monitoramento');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orderId, enabled, intervalMinutes]);

  // Função para forçar uma atualização manual
  const forceUpdate = () => {
    console.log('🔄 [SCHEDULE_MONITOR] Forçando atualização manual');
    videoScheduleService.updateAllVideosForOrder(orderId);
  };

  return {
    forceUpdate
  };
};