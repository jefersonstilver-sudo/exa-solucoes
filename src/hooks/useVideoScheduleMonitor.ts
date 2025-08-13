import { useEffect, useRef, useState, useCallback } from 'react';
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
  intervalMinutes = 5, // Aumentado de 1 para 5 minutos
  enableRealtime = true,
  onDataChange
}: UseVideoScheduleMonitorProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Função debounced para atualizar dados
  const debouncedDataChange = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      if (onDataChange) {
        console.log('🔄 [SCHEDULE_MONITOR] Executing debounced data refresh');
        onDataChange();
      }
    }, 2000); // 2 segundos de debounce
  }, [onDataChange]);

  // Função para executar sincronização via Edge Function
  const executarSincronizacao = async () => {
    if (syncInProgress) {
      return; // Silently skip if sync in progress
    }

    // Throttling: só sincroniza se passou tempo suficiente desde a última
    const now = new Date();
    if (lastSync && (now.getTime() - lastSync.getTime()) < (intervalMinutes * 60 * 1000 * 0.8)) {
      return; // Skip if less than 80% of interval has passed
    }

    try {
      setSyncInProgress(true);
      console.log('🚀 [SCHEDULE_MONITOR] Sync started for order:', orderId);
      
      const result = await videoScheduleService.forceSyncVideoSchedules(orderId);
      setLastSync(new Date());
      
      if (result?.videos_ativados > 0 || result?.videos_desativados > 0) {
        console.log('✅ [SCHEDULE_MONITOR] Video changes detected, triggering refresh');
        debouncedDataChange();
      }
    } catch (error) {
      console.error('❌ [SCHEDULE_MONITOR] Sync error:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  useEffect(() => {
    if (!enabled || !orderId) {
      return;
    }

    console.log('🕐 [SCHEDULE_MONITOR] Starting monitor:', {
      orderId: orderId.slice(0, 8) + '...',
      intervalMinutes
    });

    // Executar sincronização inicial após um delay
    const initialTimeout = setTimeout(() => {
      executarSincronizacao();
    }, 5000); // 5 segundos de delay inicial

    // Configurar intervalo para verificação contínua
    intervalRef.current = setInterval(() => {
      executarSincronizacao();
    }, intervalMinutes * 60 * 1000);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [orderId, enabled, intervalMinutes]);

  // Configurar Realtime para mudanças nos vídeos
  useEffect(() => {
    if (!enableRealtime || !orderId) {
      return;
    }

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
          // Só processa mudanças significativas
          const old_record = payload.old as any;
          const new_record = payload.new as any;
          
          const significantChange = old_record?.is_active !== new_record?.is_active ||
                                  old_record?.selected_for_display !== new_record?.selected_for_display ||
                                  old_record?.approval_status !== new_record?.approval_status;
          
          if (significantChange) {
            console.log('📢 [SCHEDULE_MONITOR] Significant change detected');
            debouncedDataChange();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, enableRealtime, debouncedDataChange]);

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