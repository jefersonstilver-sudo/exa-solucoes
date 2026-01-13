import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PAID_STATUSES } from '@/constants/pedidoStatus';

export function useBuildingVideoCount(buildingId: string): number {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    if (!buildingId) {
      setCount(0);
      return;
    }

    try {
      // 1. Buscar pedidos ativos para este prédio
      // CANÔNICO: Usa apenas status canônicos que indicam pagamento confirmado
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id')
        .in('status', PAID_STATUSES)
        .filter('lista_predios', 'cs', `{${buildingId}}`);

      if (pedidosError || !pedidos || pedidos.length === 0) {
        setCount(0);
        return;
      }

      const pedidoIds = pedidos.map(p => p.id);

      // 2. Contar vídeos ativos destes pedidos
      const { count: videoCount, error: countError } = await supabase
        .from('pedido_videos')
        .select('*', { count: 'exact', head: true })
        .in('pedido_id', pedidoIds)
        .eq('is_active', true);

      if (!countError) {
        setCount(videoCount || 0);
      }
    } catch (error) {
      console.error('[VIDEO_COUNT] Erro ao contar vídeos:', error);
      setCount(0);
    }
  };

  useEffect(() => {
    fetchCount();

    // 🔴 REALTIME: Subscrever mudanças
    const channel = supabase
      .channel(`building-video-count-${buildingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedido_videos'
        },
        () => {
          console.log('🔴 [VIDEO_COUNT] Mudança detectada, atualizando contagem...');
          fetchCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos'
        },
        () => {
          console.log('🔴 [VIDEO_COUNT] Mudança em pedidos detectada, atualizando contagem...');
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [buildingId]);

  return count;
}
