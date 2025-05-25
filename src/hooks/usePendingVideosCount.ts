
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePendingVideosCount = () => {
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      // Contar pedidos com vídeo enviado aguardando aprovação
      const { data, error } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact' })
        .eq('status', 'video_enviado');

      if (error) {
        console.error('Erro ao buscar vídeos pendentes:', error);
        return;
      }

      setPendingCount(data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar contagem de vídeos pendentes:', error);
    }
  };

  useEffect(() => {
    fetchPendingCount();

    // Configurar inscrição em tempo real
    const channel = supabase
      .channel('pending-videos-count')
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
