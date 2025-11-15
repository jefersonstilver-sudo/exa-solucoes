import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MinimalVideo {
  video_id: string;
  video_url: string;
  video_duracao: number;
  slot_position: number;
}

export interface UseMinimalDisplayVideosResult {
  videos: MinimalVideo[];
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook minimalista para buscar vídeos de display
 * - UMA ÚNICA query eficiente
 * - Sem polling automático (controle manual)
 * - Sem cache complexo
 * - Sem proteções pesadas
 */
export function useMinimalDisplayVideos(buildingId: string): UseMinimalDisplayVideosResult {
  const [videos, setVideos] = useState<MinimalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const fetchVideos = useCallback(async () => {
    if (!buildingId || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      // 1. Buscar pedidos ativos do prédio
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id')
        .in('status', ['ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago'])
        .filter('lista_predios', 'cs', `{${buildingId}}`);

      if (pedidosError) throw pedidosError;
      if (!pedidos || pedidos.length === 0) {
        setVideos([]);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // 2. Buscar vídeos em exibição
      const pedidoIds = pedidos.map(p => p.id);
      const videoPromises = pedidoIds.map(async (pedidoId) => {
        const { data: currentVideo } = await supabase.rpc('get_current_display_video', {
          p_pedido_id: pedidoId
        });

        if (!currentVideo || currentVideo.length === 0) return null;

        const videoInfo = currentVideo[0];
        
        // Buscar dados completos do vídeo
        const { data: videoData } = await supabase
          .from('pedido_videos')
          .select(`
            video_id,
            slot_position,
            videos!inner (
              id,
              url,
              duracao
            )
          `)
          .eq('pedido_id', pedidoId)
          .eq('video_id', videoInfo.video_id)
          .single();

        if (!videoData || !videoData.videos) return null;

        return {
          video_id: videoData.videos.id,
          video_url: videoData.videos.url,
          video_duracao: videoData.videos.duracao || 15,
          slot_position: videoData.slot_position
        } as MinimalVideo;
      });

      const videosArray = (await Promise.all(videoPromises)).filter(Boolean) as MinimalVideo[];
      
      // Ordenar por slot
      videosArray.sort((a, b) => a.slot_position - b.slot_position);
      
      setVideos(videosArray);
    } catch (err) {
      console.error('❌ [MINIMAL] Erro ao buscar vídeos:', err);
      setVideos([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [buildingId]);

  // ✅ Buscar vídeos APENAS na montagem inicial
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    refresh: fetchVideos
  };
}
