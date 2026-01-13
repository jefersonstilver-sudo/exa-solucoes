import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  isUpdating: boolean;
  refresh: (silent?: boolean) => Promise<void>;
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Hook minimalista para buscar vídeos de display
 * - UMA ÚNICA query eficiente
 * - Realtime automático para novas atualizações
 * - Sem cache complexo
 * - Feedback visual de atualização
 */
export function useMinimalDisplayVideos(buildingId: string): UseMinimalDisplayVideosResult {
  const [videos, setVideos] = useState<MinimalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchVideos = useCallback(async (silent = false) => {
    if (!buildingId || isFetchingRef.current) return;

    isFetchingRef.current = true;
    
    // Só mostra loading se não for verificação silenciosa
    if (!silent) {
      setLoading(true);
    }

    try {
      // 1. Buscar pedidos ativos do prédio
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id')
        .in('status', ['ativo', 'video_aprovado', 'video_enviado', 'aguardando_video'])
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
      if (!silent) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [buildingId]);

  // Debounced refresh para realtime
  const debouncedRefresh = useMemo(() => debounce(() => {
    console.log('🔄 [MINIMAL] Iniciando atualização silenciosa...');
    setIsUpdating(true);
    fetchVideos(true).finally(() => {
      setIsUpdating(false);
      console.log('✅ [MINIMAL] Atualização concluída');
    });
  }, 3000), [fetchVideos]);

  // ✅ Buscar vídeos APENAS na montagem inicial
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // ✅ REALTIME: Escutar mudanças em pedido_videos e pedidos
  useEffect(() => {
    if (!buildingId) return;

    console.log('📡 [MINIMAL] Configurando realtime para prédio:', buildingId.slice(0, 8) + '...');

    const channel = supabase
      .channel(`minimal-videos-${buildingId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pedido_videos'
      }, (payload) => {
        console.log('📡 [MINIMAL REALTIME] Mudança detectada em pedido_videos:', {
          event: payload.eventType,
          videoId: (payload.new as any)?.video_id?.slice(0, 8) + '...' || 'N/A',
          pedidoId: (payload.new as any)?.pedido_id?.slice(0, 8) + '...' || 'N/A',
          timestamp: new Date().toLocaleTimeString('pt-BR')
        });
        debouncedRefresh();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pedidos'
      }, (payload) => {
        const newPedido = payload.new as any;
        if (newPedido.lista_predios?.includes(buildingId)) {
          console.log('🆕 [MINIMAL REALTIME] Novo pedido para este prédio:', {
            pedidoId: newPedido.id?.slice(0, 8) + '...',
            buildingId: buildingId.slice(0, 8) + '...',
            timestamp: new Date().toLocaleTimeString('pt-BR')
          });
          debouncedRefresh();
        }
      })
      .subscribe();

    return () => {
      console.log('🔌 [MINIMAL] Desconectando realtime');
      supabase.removeChannel(channel);
    };
  }, [buildingId, debouncedRefresh]);

  return {
    videos,
    loading,
    isUpdating,
    refresh: fetchVideos
  };
}
