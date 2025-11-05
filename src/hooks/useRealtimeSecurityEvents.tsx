import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SecurityEvent } from '@/types/security';

const MAX_EVENTS = 100;

export const useRealtimeSecurityEvents = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Fetch initial events
    const fetchInitialEvents = async () => {
      const { data, error } = await supabase
        .from('log_eventos_sistema')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MAX_EVENTS);

      if (!error && data) {
        setEvents(data as SecurityEvent[]);
      }
    };

    fetchInitialEvents();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('security-events-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'log_eventos_sistema'
        },
        (payload) => {
          const newEvent = payload.new as SecurityEvent;
          
          // Add to top of list
          setEvents(prev => {
            const updated = [newEvent, ...prev];
            return updated.slice(0, MAX_EVENTS);
          });

          // Show toast for critical events
          if (
            newEvent.tipo_evento.includes('suspicious') ||
            newEvent.tipo_evento.includes('rate_limit_exceeded') ||
            newEvent.tipo_evento.includes('failed_login')
          ) {
            toast.error('🚨 Atividade Suspeita Detectada', {
              description: newEvent.descricao,
              duration: 5000
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    events,
    isConnected
  };
};
