import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeConnectionStatus {
  isNetworkOnline: boolean;
  isRealtimeConnected: boolean;
  lastUpdate: Date | null;
  lastHeartbeat: Date | null;
  channelStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const useRealtimeConnection = (buildingId: string) => {
  const [status, setStatus] = useState<RealtimeConnectionStatus>({
    isNetworkOnline: navigator.onLine,
    isRealtimeConnected: false,
    lastUpdate: null,
    lastHeartbeat: null,
    channelStatus: 'connecting'
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();

  // Atualizar heartbeat a cada 3 segundos
  const updateHeartbeat = useCallback(() => {
    setStatus(prev => ({ 
      ...prev, 
      lastHeartbeat: new Date() 
    }));
  }, []);

  // Detectar mudanças e atualizar timestamp
  const onDatabaseChange = useCallback(() => {
    console.log('🔄 [REALTIME] Mudança detectada no banco');
    setStatus(prev => ({ 
      ...prev, 
      lastUpdate: new Date(),
      lastHeartbeat: new Date()
    }));
  }, []);

  // Monitorar rede
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 [NETWORK] Online');
      setStatus(prev => ({ ...prev, isNetworkOnline: true }));
    };

    const handleOffline = () => {
      console.log('🔴 [NETWORK] Offline');
      setStatus(prev => ({ ...prev, isNetworkOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ping test periódico para Supabase
  useEffect(() => {
    const pingSupabase = async () => {
      try {
        const { error } = await supabase.from('buildings').select('id').limit(1);
        if (!error) {
          setStatus(prev => ({ 
            ...prev, 
            isRealtimeConnected: true,
            lastHeartbeat: new Date()
          }));
        }
      } catch (err) {
        console.error('❌ [PING] Erro ao pingar Supabase:', err);
        setStatus(prev => ({ ...prev, isRealtimeConnected: false }));
      }
    };

    // Ping inicial
    pingSupabase();

    // Ping a cada 30 segundos
    pingIntervalRef.current = setInterval(pingSupabase, 30000);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, []);

  // Heartbeat visual a cada 3 segundos
  useEffect(() => {
    heartbeatIntervalRef.current = setInterval(updateHeartbeat, 3000);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [updateHeartbeat]);

  // Setup Realtime subscription
  useEffect(() => {
    if (!buildingId) return;

    console.log('🔌 [REALTIME] Configurando subscription para building:', buildingId);

    // Criar canal Realtime para mudanças em pedido_videos
    const channel = supabase
      .channel(`realtime-connection-${buildingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedido_videos'
        },
        (payload) => {
          console.log('📡 [REALTIME] Mudança em pedido_videos:', payload);
          onDatabaseChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_video_schedules'
        },
        (payload) => {
          console.log('📡 [REALTIME] Mudança em campaign_video_schedules:', payload);
          onDatabaseChange();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_schedule_rules'
        },
        (payload) => {
          console.log('📡 [REALTIME] Mudança em campaign_schedule_rules:', payload);
          onDatabaseChange();
        }
      )
      .subscribe((status) => {
        console.log('📡 [REALTIME] Status da subscription:', status);
        
        if (status === 'SUBSCRIBED') {
          setStatus(prev => ({ 
            ...prev, 
            isRealtimeConnected: true,
            channelStatus: 'connected'
          }));
        } else if (status === 'CHANNEL_ERROR') {
          setStatus(prev => ({ 
            ...prev, 
            isRealtimeConnected: false,
            channelStatus: 'error'
          }));
        } else if (status === 'TIMED_OUT') {
          setStatus(prev => ({ 
            ...prev, 
            isRealtimeConnected: false,
            channelStatus: 'disconnected'
          }));
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 [REALTIME] Desconectando subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [buildingId, onDatabaseChange]);

  return status;
};
