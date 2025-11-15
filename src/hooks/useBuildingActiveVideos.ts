import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduleRule {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_all_day?: boolean;
}

export interface BuildingActiveVideo {
  video_id: string;
  video_name: string;
  video_url: string;
  video_duracao: number;
  pedido_id: string;
  client_email: string;
  client_name: string;
  valor_total: number;
  is_scheduled: boolean;
  priority_type: 'scheduled' | 'base';
  slot_position: number;
  schedule_rules?: ScheduleRule[];
  is_currently_active?: boolean;
  created_at?: string;
}

export interface UseBuildingActiveVideosResult {
  videos: BuildingActiveVideo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * ⚡ Hook otimizado para buscar playlist de vídeos de um prédio
 * Usa RPC otimizada que retorna tudo em uma única query
 */
export function useBuildingActiveVideos(buildingId: string): UseBuildingActiveVideosResult {
  const [videos, setVideos] = useState<BuildingActiveVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveVideos = useCallback(async () => {
    if (!buildingId) {
      setVideos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ⚡ UMA ÚNICA CHAMADA - RPC otimizada que faz tudo
      const { data, error: rpcError } = await supabase.rpc('get_building_display_playlist' as any, {
        p_building_id: buildingId
      });

      if (rpcError) {
        throw rpcError;
      }

      const typedData = data as any[];
      
      if (!typedData || typedData.length === 0) {
        setVideos([]);
        return;
      }

      // Transformar JSONB schedule_rules em array tipado
      const videosWithParsedRules: BuildingActiveVideo[] = typedData.map((video: any) => ({
        ...video,
        schedule_rules: Array.isArray(video.schedule_rules) 
          ? video.schedule_rules 
          : []
      }));

      setVideos(videosWithParsedRules);

    } catch (err: any) {
      console.error('❌ [useBuildingActiveVideos] Erro:', err);
      setError(err.message || 'Erro ao buscar vídeos');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  // Fetch inicial
  useEffect(() => {
    fetchActiveVideos();
  }, [fetchActiveVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchActiveVideos
  };
}
