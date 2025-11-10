import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UseBuildingsVideoCountResult {
  counts: Record<string, number>;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Gets the current videos-in-display count per building using the RPC
 * public.get_buildings_current_video_count(p_building_ids uuid[])
 * 
 * ⚡ REALTIME: Automatically refetches when pedido_videos or pedidos change
 */
export function useBuildingsVideoCount(buildingIds: string[] | undefined): UseBuildingsVideoCountResult {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const uniqueIds = useMemo(() => {
    return Array.from(new Set((buildingIds || []).filter(Boolean)));
  }, [buildingIds]);

  const fetchCounts = useCallback(async () => {
    if (!uniqueIds.length) {
      setCounts({});
      return;
    }
    try {
      setLoading(true);
      console.log('🔄 [VIDEO COUNT] Buscando contagem para', uniqueIds.length, 'prédios');
      
      const { data, error } = await supabase.rpc('get_buildings_current_video_count', {
        p_building_ids: uniqueIds,
      });
      if (error) throw error;

      const map: Record<string, number> = {};
      // Initialize with zeros to ensure all buildings are present
      for (const id of uniqueIds) map[id] = 0;
      (data || []).forEach((row: { building_id: string; current_videos_count: number }) => {
        if (row?.building_id) {
          map[row.building_id] = row.current_videos_count || 0;
          console.log('📊 [VIDEO COUNT] Prédio', row.building_id.slice(0, 8), '→', row.current_videos_count, 'vídeos');
        }
      });
      setCounts(map);
      console.log('✅ [VIDEO COUNT] Total de prédios com vídeos:', Object.keys(map).filter(k => map[k] > 0).length);
    } catch (err) {
      console.error('💥 [VIDEO COUNT] Erro ao buscar contagem de vídeos por prédio:', err);
    } finally {
      setLoading(false);
    }
  }, [uniqueIds]);

  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueIds.join('|')]);

  // ⚡ REALTIME: Subscribe to changes in pedido_videos and pedidos
  useEffect(() => {
    if (!uniqueIds.length) return;

    console.log('⚡ [VIDEO COUNT] Configurando realtime para', uniqueIds.length, 'prédios');

    const channel = supabase
      .channel('video-count-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'pedido_videos'
        },
        (payload) => {
          console.log('🔥 [VIDEO COUNT] Mudança em pedido_videos detectada:', payload.eventType);
          fetchCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos'
        },
        (payload) => {
          console.log('🔥 [VIDEO COUNT] Mudança em pedidos detectada:', payload.eventType);
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [VIDEO COUNT] Desconectando realtime');
      supabase.removeChannel(channel);
    };
  }, [uniqueIds.length, fetchCounts]);

  return { counts, loading, refetch: fetchCounts };
}
