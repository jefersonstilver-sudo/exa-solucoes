import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      // Buscar mensagens inbound das últimas 24h
      const { data, error } = await supabase
        .from('zapi_logs')
        .select('phone_number, agent_key, created_at')
        .eq('direction', 'inbound')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useUnreadCount] Error fetching:', error);
        throw error;
      }

      // Contar conversas únicas (phone_number + agent_key)
      const uniqueConversations = new Set(
        data?.map(log => `${log.phone_number}_${log.agent_key}`) || []
      );
      
      const count = uniqueConversations.size;
      console.log('[useUnreadCount] Unread conversations:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('[useUnreadCount] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Buscar imediatamente ao montar
    fetchUnreadCount();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);

    // Realtime subscription para atualizar imediatamente quando chegar nova mensagem
    const channel = supabase
      .channel('unread_count_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'zapi_logs',
          filter: 'direction=eq.inbound'
        },
        (payload) => {
          console.log('[useUnreadCount] New inbound message received:', payload);
          fetchUnreadCount();
        }
      )
      .subscribe((status) => {
        console.log('[useUnreadCount] Subscription status:', status);
      });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return { unreadCount, loading };
};
