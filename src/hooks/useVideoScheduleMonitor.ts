import { useEffect, useRef, useState } from 'react';
import { videoScheduleService } from '@/services/videoScheduleService';
import { supabase } from '@/integrations/supabase/client';

interface UseVideoScheduleMonitorProps {
  orderId: string;
  enabled?: boolean;
  intervalMinutes?: number;
  enableRealtime?: boolean;
  onDataChange?: () => void;
}

export const useVideoScheduleMonitor = ({ 
  orderId, 
  enabled = true, 
  intervalMinutes = 1,
  enableRealtime = true,
  onDataChange
}: UseVideoScheduleMonitorProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Função para executar sincronização via Edge Function
  const executarSincronizacao = async () => {
    if (syncInProgress) {
      console.log('🔄 [SCHEDULE_MONITOR] Sync already in progress, skipping...');
      return;
    }

    try {
      setSyncInProgress(true);
      console.log('🚀 [SCHEDULE_MONITOR] Iniciando sincronização via Edge Function:', orderId);
      
      const result = await videoScheduleService.forceSyncVideoSchedules(orderId);
      setLastSync(new Date());
      
      console.log('✅ [SCHEDULE_MONITOR] Sincronização concluída:', result);
    } catch (error) {
      console.error('❌ [SCHEDULE_MONITOR] Erro na sincronização:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  useEffect(() => {
    if (!enabled || !orderId) {
      return;
    }

    console.log('🕐 [SCHEDULE_MONITOR] Iniciando monitoramento automático:', {
      orderId,
      intervalMinutes,
      enableRealtime
    });

    // Executar sincronização imediatamente
    executarSincronizacao();

    // Configurar intervalo para verificação contínua via Edge Function
    intervalRef.current = setInterval(() => {
      console.log('⏰ [SCHEDULE_MONITOR] Executando sincronização periódica');
      executarSincronizacao();
    }, intervalMinutes * 60 * 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        console.log('🛑 [SCHEDULE_MONITOR] Parando monitoramento');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orderId, enabled, intervalMinutes]);

  // Configurar Realtime para mudanças nos vídeos
  useEffect(() => {
    if (!enableRealtime || !orderId) {
      return;
    }

    console.log('📡 [SCHEDULE_MONITOR] Configurando Realtime para pedido:', orderId);

    const channel = supabase
      .channel(`pedido-videos-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedido_videos',
          filter: `pedido_id=eq.${orderId}`
        },
        (payload) => {
          console.log('📢 [SCHEDULE_MONITOR] Mudança detectada em pedido_videos:', payload);
          // Atualiza dados via callback em vez de recarregar a página
          if (onDataChange) {
            setTimeout(() => {
              onDataChange();
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('📡 [SCHEDULE_MONITOR] Desconectando Realtime');
      supabase.removeChannel(channel);
    };
  }, [orderId, enableRealtime]);

  // Função para forçar uma atualização manual
  const forceUpdate = async () => {
    console.log('🔄 [SCHEDULE_MONITOR] Forçando atualização manual');
    await executarSincronizacao();
  };

  return {
    forceUpdate,
    lastSync,
    syncInProgress
  };
};