import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      // Buscar conversas aguardando resposta
      const { data, count, error } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: false })
        .eq('awaiting_response', true);

      if (error) {
        console.error('[useUnreadCount] Error fetching:', error);
        throw error;
      }

      const unreadCount = count || 0;
      console.log('[useUnreadCount] Conversations awaiting response:', unreadCount);
      setUnreadCount(unreadCount);
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

    // Realtime subscription para atualizar quando conversas mudarem
    const channel = supabase
      .channel('unread_count_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('[useUnreadCount] Conversation updated:', payload);
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
