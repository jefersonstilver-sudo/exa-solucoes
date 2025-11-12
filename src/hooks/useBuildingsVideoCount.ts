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
      console.log('🔍 [VIDEO COUNT] IDs:', uniqueIds.map(id => id.slice(0, 8)).join(', '));
      
      const { data, error } = await supabase.rpc('get_buildings_current_video_count' as any, {
        p_building_ids: uniqueIds,
      }) as { data: { building_id: string; current_videos_count: number }[] | null; error: any };
      
      if (error) {
        console.error('💥 [VIDEO COUNT] Erro na RPC:', error);
        throw error;
      }

      console.log('📦 [VIDEO COUNT] Dados recebidos da RPC:', Array.isArray(data) ? data.length : 0, 'registros');

      const map: Record<string, number> = {};
      // Initialize with zeros to ensure all buildings are present
      for (const id of uniqueIds) map[id] = 0;
      
      if (Array.isArray(data)) {
        data.forEach((row: { building_id: string; current_videos_count: number }) => {
        if (row?.building_id) {
          map[row.building_id] = row.current_videos_count || 0;
          if (row.current_videos_count > 0) {
            console.log('📊 [VIDEO COUNT] ✅', row.building_id.slice(0, 8), '→', row.current_videos_count, 'vídeos');
          }
        }
        });
      }
      
      setCounts(map);
      const activeBuildings = Object.keys(map).filter(k => map[k] > 0);
      console.log('✅ [VIDEO COUNT] Prédios com vídeos:', activeBuildings.length, 'de', uniqueIds.length);
      console.log('📈 [VIDEO COUNT] Total de vídeos em exibição:', Object.values(map).reduce((a, b) => a + b, 0));
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
