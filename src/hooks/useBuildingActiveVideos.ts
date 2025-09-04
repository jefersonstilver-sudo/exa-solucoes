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

      // 2. Para cada pedido, buscar o vídeo atual em exibição
      const activeVideos: BuildingActiveVideo[] = [];
      
      for (const pedido of pedidos) {
        try {
          console.log('🔍 [BUILDING ACTIVE VIDEOS] Verificando vídeo atual para pedido:', pedido.id);
          
          // Usar a função RPC para obter o vídeo atual
          const { data: currentVideo, error: videoError } = await supabase
            .rpc('get_current_display_video', { p_pedido_id: pedido.id });

          if (videoError) {
            console.warn(`⚠️ Erro ao buscar vídeo do pedido ${pedido.id}:`, videoError);
            continue;
          }

          if (!currentVideo || currentVideo.length === 0) {
            console.log(`📭 Nenhum vídeo em exibição para pedido ${pedido.id}`);
            continue;
          }

          const videoInfo = currentVideo[0];

          // 3. Buscar dados detalhados do vídeo
          const { data: videoData, error: videoDetailsError } = await supabase
            .from('videos')
            .select('id, nome, url, duracao')
            .eq('id', videoInfo.video_id)
            .single();

          if (videoDetailsError || !videoData) {
            console.warn(`⚠️ Erro ao buscar dados do vídeo ${videoInfo.video_id}:`, videoDetailsError);
            continue;
          }

          // 4. Buscar dados do cliente
          const { data: clientData, error: clientError } = await supabase
            .from('users')
            .select('email')
            .eq('id', pedido.client_id)
            .single();

          const clientEmail = clientData?.email || 'Email não encontrado';
          const clientName = clientEmail.split('@')[0] || 'Cliente';

          // 5. Buscar dados do pedido_video para obter slot_position
          const { data: pedidoVideo, error: pedidoVideoError } = await supabase
            .from('pedido_videos')
            .select('slot_position')
            .eq('pedido_id', pedido.id)
            .eq('video_id', videoInfo.video_id)
            .single();

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

          console.log('✅ [BUILDING ACTIVE VIDEOS] Vídeo adicionado:', {
            video_name: videoData.nome,
            client: clientName,
            type: videoInfo.priority_type
          });

        } catch (err) {
          console.error(`💥 Erro ao processar pedido ${pedido.id}:`, err);
        }
      }

      setVideos(activeVideos);
      console.log(`🎉 [BUILDING ACTIVE VIDEOS] Total de ${activeVideos.length} vídeos ativos encontrados`);

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