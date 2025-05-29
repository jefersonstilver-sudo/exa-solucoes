
import { supabase } from '@/integrations/supabase/client';
import { VideoSlot } from '@/types/videoManagement';

export const loadVideoSlots = async (orderId: string): Promise<VideoSlot[]> => {
  if (!orderId) return [];

  console.log('Carregando slots de vídeo para pedido:', orderId);

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

  // Criar slots 1-4, preenchendo com dados existentes
  const slots: VideoSlot[] = [1, 2, 3, 4].map(position => {
    const existingVideo = pedidoVideos?.find(pv => pv.slot_position === position);
    
    const slot: VideoSlot = {
      id: existingVideo?.id,
      slot_position: position,
      video_id: existingVideo?.video_id,
      is_active: existingVideo?.is_active || false,
      selected_for_display: existingVideo?.selected_for_display || false,
      approval_status: (existingVideo?.approval_status as 'pending' | 'approved' | 'rejected') || 'pending',
      video_data: existingVideo?.videos ? {
        id: existingVideo.videos.id,
        nome: existingVideo.videos.nome,
        url: existingVideo.videos.url,
        duracao: existingVideo.videos.duracao,
        orientacao: existingVideo.videos.orientacao,
        tem_audio: existingVideo.videos.tem_audio,
        tamanho_arquivo: existingVideo.videos.tamanho_arquivo,
        formato: existingVideo.videos.formato
      } : undefined,
      rejection_reason: existingVideo?.rejection_reason
    };

    // Log detalhado para debug
    if (slot.video_data) {
      console.log(`Slot ${position} - Video URL:`, slot.video_data.url);
      console.log(`Slot ${position} - Video completo:`, slot.video_data);
    }

    return slot;
  });

  console.log('Slots processados:', slots);
  return slots;
};
