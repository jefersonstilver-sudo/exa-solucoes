
import { supabase } from '@/integrations/supabase/client';
import { VideoSlot } from '@/types/videoManagement';
import { toast } from 'sonner';
import { uploadVideo } from './videoUploadService';
import { deleteVideoFromStorage } from './videoStorageService';

export const loadOrderVideos = async (orderId: string): Promise<VideoSlot[]> => {
  if (!orderId) return [];

  console.log('Carregando vídeos para pedido:', orderId);

  const { data: pedidoVideos, error } = await supabase
    .from('pedido_videos')
    .select(`
      id,
      slot_position,
      video_id,
      is_active,
      selected_for_display,
      approval_status,
      rejection_reason,
      videos (
        id,
        nome,
        url,
        duracao,
        orientacao,
        tem_audio,
        tamanho_arquivo,
        formato
      )
    `)
    .eq('pedido_id', orderId);

  if (error) {
    console.error('Erro ao carregar pedido_videos:', error);
    throw error;
  }

  console.log('Dados carregados do banco:', pedidoVideos);

  // Converter para VideoSlot[]
  const slots: VideoSlot[] = (pedidoVideos || []).map(pv => ({
    id: pv.id,
    slot_position: pv.slot_position,
    video_id: pv.video_id,
    is_active: pv.is_active || false,
    selected_for_display: pv.selected_for_display || false,
    approval_status: (pv.approval_status as 'pending' | 'approved' | 'rejected') || 'pending',
    video_data: pv.videos ? {
      id: pv.videos.id,
      nome: pv.videos.nome,
      url: pv.videos.url,
      duracao: pv.videos.duracao,
      orientacao: pv.videos.orientacao,
      tem_audio: pv.videos.tem_audio,
      tamanho_arquivo: pv.videos.tamanho_arquivo,
      formato: pv.videos.formato
    } : undefined,
    rejection_reason: pv.rejection_reason
  }));

  console.log('Slots processados:', slots);
  return slots;
};

export const uploadOrderVideo = async (
  orderId: string,
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  try {
    // Verificar quantos vídeos já existem para este pedido
    const existingVideos = await loadOrderVideos(orderId);
    if (existingVideos.length >= 4) {
      toast.error('Você já atingiu o limite de 4 vídeos para este pedido');
      return false;
    }

    // Usar a próxima posição disponível (1-4)
    const nextPosition = Math.max(0, ...existingVideos.map(v => v.slot_position)) + 1;
    
    const success = await uploadVideo(
      nextPosition,
      file,
      userId,
      orderId,
      onProgress
    );

    return success;
  } catch (error) {
    console.error('Erro no upload do vídeo:', error);
    toast.error('Erro ao fazer upload do vídeo');
    return false;
  }
};

export const selectVideoForDisplay = async (slotId: string, orderId: string): Promise<boolean> => {
  try {
    console.log('Selecionando vídeo para exibição:', slotId);

    // Primeiro, desmarcar todos os outros vídeos do pedido
    const { error: clearError } = await supabase
      .from('pedido_videos')
      .update({ selected_for_display: false })
      .eq('pedido_id', orderId);

    if (clearError) {
      console.error('Erro ao limpar seleções:', clearError);
      throw clearError;
    }

    // Depois, marcar apenas o vídeo selecionado
    const { error: selectError } = await supabase
      .from('pedido_videos')
      .update({ selected_for_display: true })
      .eq('id', slotId);

    if (selectError) {
      console.error('Erro ao selecionar vídeo:', selectError);
      throw selectError;
    }

    toast.success('Vídeo selecionado para exibição!');
    return true;
  } catch (error) {
    console.error('Erro ao selecionar vídeo:', error);
    toast.error('Erro ao selecionar vídeo para exibição');
    return false;
  }
};

export const removeVideo = async (slotId: string): Promise<boolean> => {
  try {
    console.log('Removendo vídeo:', slotId);

    // Buscar dados do vídeo para deletar do storage
    const { data: slotData, error: fetchError } = await supabase
      .from('pedido_videos')
      .select(`
        video_id,
        videos (url)
      `)
      .eq('id', slotId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar dados do vídeo:', fetchError);
      throw fetchError;
    }

    // Deletar do storage se houver URL
    if (slotData?.videos?.url) {
      try {
        await deleteVideoFromStorage(slotData.videos.url);
      } catch (storageError) {
        console.warn('Erro ao deletar do storage (não crítico):', storageError);
      }
    }

    // Deletar registro do vídeo
    if (slotData?.video_id) {
      const { error: videoError } = await supabase
        .from('videos')
        .delete()
        .eq('id', slotData.video_id);

      if (videoError) {
        console.error('Erro ao deletar vídeo:', videoError);
        throw videoError;
      }
    }

    // Deletar entrada do pedido_videos
    const { error: slotError } = await supabase
      .from('pedido_videos')
      .delete()
      .eq('id', slotId);

    if (slotError) {
      console.error('Erro ao deletar entrada do pedido:', slotError);
      throw slotError;
    }

    toast.success('Vídeo removido com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao remover vídeo:', error);
    toast.error('Erro ao remover vídeo');
    return false;
  }
};
