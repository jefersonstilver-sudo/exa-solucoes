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
      const { data, error } = await supabase.rpc('get_buildings_current_video_count', {
        p_building_ids: uniqueIds,
      });
      if (error) throw error;

      const map: Record<string, number> = {};
      // Initialize with zeros to ensure all buildings are present
      for (const id of uniqueIds) map[id] = 0;
      (data || []).forEach((row: { building_id: string; current_videos_count: number }) => {
        if (row?.building_id) map[row.building_id] = row.current_videos_count || 0;
      });
      setCounts(map);
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

  return { counts, loading, refetch: fetchCounts };
}
