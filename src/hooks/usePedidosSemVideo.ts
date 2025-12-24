import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePedidosSemVideo = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      // Primeiro, buscar IDs de pedidos que já têm vídeos
      const { data: pedidosComVideo } = await supabase
        .from('pedido_videos')
        .select('pedido_id');

      const pedidoIdsComVideo = pedidosComVideo?.map(pv => pv.pedido_id) || [];

      // Buscar pedidos ativos/pagos que NÃO têm vídeo
      let query = supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pago', 'pago_pendente_video', 'ativo']);

      if (pedidoIdsComVideo.length > 0) {
        query = query.not('id', 'in', `(${pedidoIdsComVideo.join(',')})`);
      }

      const { count: totalCount, error } = await query;

      if (error) {
        console.error('Erro ao buscar pedidos sem vídeo:', error);
        return;
      }

      setCount(totalCount || 0);
    } catch (error) {
      console.error('Erro ao buscar pedidos sem vídeo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Realtime subscription
    const channel = supabase
      .channel('pedidos-sem-video')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pedidos' }, 
        () => fetchCount()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pedido_videos' }, 
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading, refetch: fetchCount };
};
