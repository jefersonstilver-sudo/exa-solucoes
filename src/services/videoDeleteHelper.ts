import { supabase } from '@/integrations/supabase/client';

/**
 * Helper centralizado para deletar vídeo:
 * 1. Chama API externa para remover dos prédios
 * 2. Remove do banco de dados
 * 
 * TODOS os fluxos de exclusão devem usar este helper.
 */
export const deleteVideoWithExternalAPI = async (
  pedidoVideoId: string,
  videoId?: string,
  pedidoId?: string
): Promise<void> => {
  console.log(`🗑️ [DELETE_HELPER] Iniciando exclusão do pedido_video: ${pedidoVideoId}`);

  // Se não temos video_id/pedido_id, buscar do banco
  let resolvedVideoId = videoId;
  let resolvedPedidoId = pedidoId;

  if (!resolvedVideoId || !resolvedPedidoId) {
    const { data, error } = await supabase
      .from('pedido_videos')
      .select('video_id, pedido_id')
      .eq('id', pedidoVideoId)
      .single();

    if (error || !data) {
      console.error('❌ [DELETE_HELPER] Não encontrou pedido_video:', error);
      throw new Error('Registro de vídeo não encontrado');
    }

    resolvedVideoId = data.video_id;
    resolvedPedidoId = data.pedido_id;
  }

  // 1. Chamar API externa ANTES de deletar do banco
  if (resolvedVideoId && resolvedPedidoId) {
    try {
      console.log(`🔄 [DELETE_HELPER] Chamando API externa para video_id=${resolvedVideoId}, pedido_id=${resolvedPedidoId}`);
      
      const { data: extResult, error: extError } = await supabase.functions.invoke(
        'delete-video-from-external-api',
        {
          body: {
            video_id: resolvedVideoId,
            pedido_id: resolvedPedidoId
          }
        }
      );

      if (extError) {
        console.warn('⚠️ [DELETE_HELPER] Erro na API externa (continuando com deleção local):', extError.message);
      } else {
        console.log('✅ [DELETE_HELPER] API externa respondeu:', extResult);
      }
    } catch (apiError: any) {
      console.warn('⚠️ [DELETE_HELPER] Falha ao chamar API externa (continuando com deleção local):', apiError.message);
    }
  }

  // 2. Deletar do banco
  const { error: deleteError } = await supabase
    .from('pedido_videos')
    .delete()
    .eq('id', pedidoVideoId);

  if (deleteError) {
    console.error('❌ [DELETE_HELPER] Erro ao deletar do banco:', deleteError);
    throw deleteError;
  }

  console.log('✅ [DELETE_HELPER] Vídeo deletado com sucesso (API externa + banco)');
};
