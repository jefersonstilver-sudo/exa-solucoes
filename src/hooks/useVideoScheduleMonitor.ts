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
  enabled = false, // TEMPORARIAMENTE DESABILITADO para parar os reloads
  intervalMinutes = 30, // Aumentado para 30 minutos quando reativado
  enableRealtime = false, // TEMPORARIAMENTE DESABILITADO
  onDataChange
}: UseVideoScheduleMonitorProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [isOnCooldown, setIsOnCooldown] = useState(false);

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
    }, 5000); // Aumentado de 2 para 5 segundos de debounce
  }, [onDataChange]);

  // Função para executar sincronização via Edge Function
  const executarSincronizacao = async () => {
    if (syncInProgress || isOnCooldown) {
      console.log('🚫 [SCHEDULE_MONITOR] Sync skipped - in progress or on cooldown');
      return;
    }

    // Throttling: só sincroniza se passou tempo suficiente desde a última
    const now = new Date();
    if (lastSync && (now.getTime() - lastSync.getTime()) < (intervalMinutes * 60 * 1000 * 0.9)) {
      console.log('⏰ [SCHEDULE_MONITOR] Sync skipped - too soon since last sync');
      return;
    }

    try {
      setSyncInProgress(true);
      setIsOnCooldown(true);
      console.log('🚀 [SCHEDULE_MONITOR] Sync started for order:', orderId);
      
      const result = await videoScheduleService.forceSyncVideoSchedules(orderId);
      setLastSync(new Date());
      
      if (result?.videos_ativados > 0 || result?.videos_desativados > 0) {
        console.log('✅ [SCHEDULE_MONITOR] Video changes detected, triggering refresh');
        debouncedDataChange();
      } else {
        console.log('📝 [SCHEDULE_MONITOR] No video changes detected');
      }

      // Cooldown de 2 minutos após cada sincronização
      cooldownRef.current = setTimeout(() => {
        setIsOnCooldown(false);
      }, 2 * 60 * 1000);

    } catch (error) {
      console.error('❌ [SCHEDULE_MONITOR] Sync error:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  useEffect(() => {
    if (!enabled || !orderId) {
      console.log('🛑 [SCHEDULE_MONITOR] Monitor disabled or no orderId');
      return;
    }

    console.log('🕐 [SCHEDULE_MONITOR] Starting monitor:', {
      orderId: orderId.slice(0, 8) + '...',
      intervalMinutes,
      enabled
    });

    // Executar sincronização inicial após um delay maior
    const initialTimeout = setTimeout(() => {
      executarSincronizacao();
    }, 10000); // Aumentado para 10 segundos de delay inicial

    // Configurar intervalo para verificação contínua com intervalo maior
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
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
        cooldownRef.current = null;
      }
    };
  }, [orderId, enabled, intervalMinutes]);

  // Configurar Realtime para mudanças nos vídeos - TEMPORARIAMENTE DESABILITADO
  useEffect(() => {
    if (!enableRealtime || !orderId) {
      console.log('🛑 [SCHEDULE_MONITOR] Realtime disabled');
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
          // Só processa mudanças significativas e se não estiver em cooldown
          if (isOnCooldown) {
            console.log('🛑 [SCHEDULE_MONITOR] Realtime event ignored - on cooldown');
            return;
          }

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
  }, [orderId, enableRealtime, debouncedDataChange, isOnCooldown]);

  // Função para forçar uma atualização manual
  const forceUpdate = async () => {
    console.log('🔄 [SCHEDULE_MONITOR] Forcing manual update');
    await executarSincronizacao();
  };

  return {
    forceUpdate,
    lastSync,
    syncInProgress,
    isOnCooldown
  };
};