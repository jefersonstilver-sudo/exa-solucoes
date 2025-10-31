import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

export interface UseBuildingActiveVideosResult {
  videos: BuildingActiveVideo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBuildingActiveVideos(buildingId: string): UseBuildingActiveVideosResult {
  const [videos, setVideos] = useState<BuildingActiveVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveVideos = async () => {
    if (!buildingId) {
      setVideos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🎬 [BUILDING ACTIVE VIDEOS] Buscando vídeos para prédio:', buildingId);

      // 1. Buscar pedidos ativos para este prédio
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select(`
          id,
          client_id,
          valor_total,
          status,
          data_inicio,
          data_fim,
          lista_predios
        `)
        .contains('lista_predios', [buildingId])
        .in('status', ['ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago']);

      if (pedidosError) {
        throw new Error(`Erro ao buscar pedidos: ${pedidosError.message}`);
      }

      if (!pedidos || pedidos.length === 0) {
        console.log('📭 [BUILDING ACTIVE VIDEOS] Nenhum pedido ativo encontrado para este prédio');
        setVideos([]);
        return;
      }

      // ⚡ OTIMIZAÇÃO: Buscar vídeos atuais em paralelo (reduz N+1 queries)
      const pedidoIds = pedidos.map(p => p.id);
      
      console.log('⚡ [BUILDING ACTIVE VIDEOS] Buscando vídeos para', pedidoIds.length, 'pedidos');
      const startTime = performance.now();

      // 2. Buscar vídeos atuais para cada pedido
      const currentVideosPromises = pedidoIds.map(async (pedidoId) => {
        const { data, error } = await supabase
          .rpc('get_current_display_video', { p_pedido_id: pedidoId });
        
        if (error) {
          console.error(`❌ Erro ao buscar vídeo atual para pedido ${pedidoId}:`, error);
          return null;
        }
        
        // RPC retorna um array, pegar o primeiro item
        const videoData = Array.isArray(data) && data.length > 0 ? data[0] : null;
        return videoData ? { ...videoData, pedido_id: pedidoId } : null;
      });

      const currentVideosResults = await Promise.all(currentVideosPromises);
      const currentVideosData = currentVideosResults.filter(v => v !== null) as Array<{
        video_id: string;
        is_scheduled: boolean;
        priority_type: string;
        pedido_id: string;
      }>;

      const batchTime = performance.now();
      console.log(`✅ [BUILDING ACTIVE VIDEOS] Vídeos atuais carregados em ${(batchTime - startTime).toFixed(0)}ms`);

      if (!currentVideosData || currentVideosData.length === 0) {
        console.log('📭 [BUILDING ACTIVE VIDEOS] Nenhum vídeo em exibição encontrado');
        setVideos([]);
        return;
      }

      // 3. Extrair todos os IDs necessários
      const videoIds = [...new Set(currentVideosData.map(v => v.video_id).filter(Boolean))];
      const clientIds = [...new Set(pedidos.map(p => p.client_id))];

      // 4. Buscar dados de vídeos e clientes em PARALELO
      const [videosData, clientsData, pedidoVideosData] = await Promise.all([
        supabase.from('videos').select('id, nome, url, duracao').in('id', videoIds),
        supabase.from('users').select('id, email').in('id', clientIds),
        supabase.from('pedido_videos').select('pedido_id, video_id, slot_position').in('pedido_id', pedidoIds)
      ]);

      const parallelTime = performance.now();
      console.log(`✅ [BUILDING ACTIVE VIDEOS] Queries paralelas concluídas em ${(parallelTime - batchTime).toFixed(0)}ms`);

      // 5. Criar maps para lookup O(1)
      const videosMap = new Map(videosData.data?.map(v => [v.id, v]) || []);
      const clientsMap = new Map(clientsData.data?.map(c => [c.id, c]) || []);
      const pedidoVideosMap = new Map(
        pedidoVideosData.data?.map(pv => [`${pv.pedido_id}_${pv.video_id}`, pv]) || []
      );

      // 6. Montar resultado final
      const activeVideos: BuildingActiveVideo[] = [];

      for (const videoInfo of currentVideosData) {
        const pedido = pedidos.find(p => p.id === videoInfo.pedido_id);
        if (!pedido) continue;

        const videoData = videosMap.get(videoInfo.video_id);
        if (!videoData) continue;

        const clientData = clientsMap.get(pedido.client_id);
        const clientEmail = clientData?.email || 'Email não encontrado';
        const clientName = clientEmail.split('@')[0] || 'Cliente';

        const pedidoVideo = pedidoVideosMap.get(`${pedido.id}_${videoInfo.video_id}`);

        activeVideos.push({
          video_id: videoInfo.video_id,
          video_name: videoData.nome,
          video_url: videoData.url,
          video_duracao: videoData.duracao || 30,
          pedido_id: pedido.id,
          client_email: clientEmail,
          client_name: clientName,
          valor_total: pedido.valor_total || 0,
          is_scheduled: videoInfo.is_scheduled || false,
          priority_type: (videoInfo.priority_type === 'scheduled' ? 'scheduled' : 'base') as 'scheduled' | 'base',
          slot_position: pedidoVideo?.slot_position || 1
        });
      }

      const endTime = performance.now();
      const totalTime = (endTime - startTime).toFixed(0);
      
      setVideos(activeVideos);
      console.log(`🎉 [BUILDING ACTIVE VIDEOS] Total de ${activeVideos.length} vídeos ativos encontrados em ${totalTime}ms (otimizado)`);

    } catch (error: any) {
      console.error('💥 [BUILDING ACTIVE VIDEOS] Erro geral:', error);
      setError(error.message || 'Erro ao carregar vídeos ativos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVideos();
  }, [buildingId]);

  return {
    videos,
    loading,
    error,
    refetch: fetchActiveVideos
  };
}