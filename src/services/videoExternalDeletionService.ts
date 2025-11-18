import { supabase } from '@/integrations/supabase/client';

interface VideoToDelete {
  video_id: string;
  pedido_id: string;
  video_nome: string;
  building_ids: string[];
}

export const deleteVideosFromExternalAPI = async (
  videos: VideoToDelete[]
): Promise<{
  success: boolean;
  deleted_count: number;
  failed_count: number;
  errors: string[];
}> => {
  const results = {
    success: true,
    deleted_count: 0,
    failed_count: 0,
    errors: [] as string[]
  };

  for (const video of videos) {
    try {
      console.log(`🗑️ [AWS_DELETE] Deletando vídeo ${video.video_nome} da AWS...`);
      
      const { data, error } = await supabase.functions.invoke(
        'delete-video-from-external-api',
        {
          body: {
            video_id: video.video_id,
            pedido_id: video.pedido_id
          }
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido na AWS');
      }

      console.log(`✅ [AWS_DELETE] Vídeo ${video.video_nome} deletado de ${data.buildings_count} prédio(s)`);
      results.deleted_count++;
      
    } catch (error: any) {
      console.error(`❌ [AWS_DELETE] Erro ao deletar vídeo ${video.video_nome}:`, error);
      results.failed_count++;
      results.errors.push(`${video.video_nome}: ${error.message}`);
      results.success = false;
    }
  }

  return results;
};

export const fetchVideosToDelete = async (pedidoIds: string[]): Promise<VideoToDelete[]> => {
  const { data: pedidoVideos, error } = await supabase
    .from('pedido_videos')
    .select(`
      video_id,
      pedido_id,
      videos(nome, url),
      pedidos!inner(lista_predios)
    `)
    .in('pedido_id', pedidoIds)
    .not('video_id', 'is', null);

  if (error) throw error;

  return pedidoVideos.map((pv: any) => ({
    video_id: pv.video_id,
    pedido_id: pv.pedido_id,
    video_nome: pv.videos.nome,
    building_ids: pv.pedidos.lista_predios
  }));
};
