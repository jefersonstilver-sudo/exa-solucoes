
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { deleteVideoFromStorage } from '@/services/videoStorageService';
import { VideoSlot } from '@/types/videoManagement';

export const selectVideoForDisplay = async (slotId: string): Promise<boolean> => {
  try {
    console.log('Selecionando vídeo para exibição:', slotId);
    
    const { data, error } = await supabase.rpc('select_video_for_display', {
      p_pedido_video_id: slotId
    });

    if (error) throw error;

    if (data) {
      toast.success('Vídeo selecionado para exibição!');
      return true;
    } else {
      toast.error('Erro ao selecionar vídeo');
      return false;
    }
  } catch (error) {
    console.error('Erro ao selecionar vídeo:', error);
    toast.error('Erro ao selecionar vídeo para exibição');
    return false;
  }
};

export const activateVideo = async (slotId: string, orderId: string): Promise<boolean> => {
  try {
    console.log('Ativando vídeo:', slotId);
    
    const { data, error } = await supabase.rpc('activate_video', {
      p_pedido_id: orderId,
      p_pedido_video_id: slotId
    });

    if (error) throw error;

    if (data) {
      toast.success('Vídeo ativado com sucesso!');
      return true;
    } else {
      toast.error('Apenas vídeos aprovados podem ser ativados');
      return false;
    }
  } catch (error) {
    console.error('Erro ao ativar vídeo:', error);
    toast.error('Erro ao ativar vídeo');
    return false;
  }
};

export const removeVideo = async (
  slotId: string, 
  videoSlots: VideoSlot[]
): Promise<boolean> => {
  try {
    console.log('Removendo vídeo:', slotId);
    
    // Verificar se é o único vídeo selecionado
    const selectedVideos = videoSlots.filter(slot => 
      slot.video_data && slot.selected_for_display
    );
    
    const videoToRemove = videoSlots.find(slot => slot.id === slotId);
    
    if (selectedVideos.length === 1 && videoToRemove?.selected_for_display) {
      toast.error('Não é possível remover o único vídeo selecionado. Selecione outro vídeo primeiro.');
      return false;
    }

    // Deletar arquivo do storage se existir
    if (videoToRemove?.video_data?.url && videoToRemove.video_data.url !== 'pending_upload') {
      await deleteVideoFromStorage(videoToRemove.video_data.url);
    }

    // Deletar do banco
    const { error } = await supabase
      .from('pedido_videos')
      .delete()
      .eq('id', slotId);

    if (error) throw error;

    toast.success('Vídeo removido com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao remover vídeo:', error);
    toast.error('Erro ao remover vídeo');
    return false;
  }
};
