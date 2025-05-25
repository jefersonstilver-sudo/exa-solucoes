
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePendingVideosCount = () => {
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      // Usar a nova função para contar vídeos pendentes
      const { data, error } = await supabase.rpc('get_approvals_stats');

      if (error) {
        console.error('Erro ao buscar estatísticas de vídeos pendentes:', error);
        return;
      }

      if (data && data.length > 0) {
        const stats = data[0];
        // Contar apenas vídeos enviados que aguardam aprovação do admin
        const totalPending = Number(stats.video_enviado || 0);
        setPendingCount(totalPending);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de vídeos pendentes:', error);
    }
  };

  useEffect(() => {
    fetchPendingCount();

    // Configurar inscrição em tempo real
    const channel = supabase
      .channel('pending-videos-count-complete')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedidos' 
        }, 
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { pendingCount, refetch: fetchPendingCount };
};
