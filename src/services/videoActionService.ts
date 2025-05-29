
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { deleteVideoFromStorage } from '@/services/videoStorageService';
import { VideoSlot } from '@/types/videoManagement';

export const selectVideoForDisplay = async (
  slotId: string, 
  onSuccess?: (videoName?: string) => void
): Promise<boolean> => {
  try {
    console.log('🔄 [VIDEO_ACTION] Iniciando seleção de vídeo:', slotId);
    
    // NOVA VALIDAÇÃO: Verificar se o vídeo está aprovado antes de selecionar
    const { data: videoData, error: checkError } = await supabase
      .from('pedido_videos')
      .select('approval_status, pedido_id')
      .eq('id', slotId)
      .single();

    if (checkError) {
      console.error('❌ [VIDEO_ACTION] Erro ao verificar vídeo:', checkError);
      throw checkError;
    }

    if (!videoData) {
      console.error('❌ [VIDEO_ACTION] Vídeo não encontrado:', slotId);
      toast.error('Vídeo não encontrado');
      return false;
    }

    // VALIDAÇÃO CRÍTICA: Apenas vídeos aprovados podem ser selecionados
    if (videoData.approval_status !== 'approved') {
      console.warn('⚠️ [VIDEO_ACTION] Tentativa de selecionar vídeo não aprovado:', {
        slotId,
        status: videoData.approval_status
      });
      
      const statusMessages = {
        'pending': 'Este vídeo ainda está aguardando aprovação dos administradores.',
        'rejected': 'Este vídeo foi rejeitado e não pode ser selecionado para exibição.'
      };
      
      const message = statusMessages[videoData.approval_status as keyof typeof statusMessages] || 
                     'Apenas vídeos aprovados podem ser selecionados para exibição.';
      
      toast.error(`❌ Seleção não permitida: ${message}`);
      return false;
    }

    console.log('✅ [VIDEO_ACTION] Vídeo aprovado, usando função corrigida para seleção');
    
    // Usar a função RPC corrigida que permite troca de seleção
    const { data, error } = await supabase.rpc('select_video_for_display', {
      p_pedido_video_id: slotId
    });

    if (error) {
      console.error('❌ [VIDEO_ACTION] Erro na função RPC:', error);
      throw error;
    }

    if (data) {
      console.log('✅ [VIDEO_ACTION] Vídeo selecionado com sucesso (troca permitida)');
      
      // Buscar nome do vídeo para o popup
      const { data: videoInfo } = await supabase
        .from('pedido_videos')
        .select('videos(nome)')
        .eq('id', slotId)
        .single();

      const videoName = videoInfo?.videos?.nome;
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess(videoName);
      }
      
      toast.success('✅ Vídeo selecionado para exibição!');
      return true;
    } else {
      console.error('❌ [VIDEO_ACTION] Função RPC retornou falso');
      toast.error('❌ Erro ao selecionar vídeo');
      return false;
    }
  } catch (error) {
    console.error('💥 [VIDEO_ACTION] Erro geral ao selecionar vídeo:', error);
    toast.error('❌ Erro ao selecionar vídeo para exibição');
    return false;
  }
};

export const activateVideo = async (slotId: string, orderId: string): Promise<boolean> => {
  try {
    console.log('▶️ [VIDEO_ACTION] Ativando vídeo:', slotId);
    
    const { data, error } = await supabase.rpc('activate_video', {
      p_pedido_id: orderId,
      p_pedido_video_id: slotId
    });

    if (error) throw error;

    if (data) {
      toast.success('✅ Vídeo ativado com sucesso!');
      return true;
    } else {
      toast.error('❌ Apenas vídeos aprovados podem ser ativados');
      return false;
    }
  } catch (error) {
    console.error('❌ [VIDEO_ACTION] Erro ao ativar vídeo:', error);
    toast.error('❌ Erro ao ativar vídeo');
    return false;
  }
};

export const removeVideo = async (
  slotId: string, 
  videoSlots: VideoSlot[]
): Promise<boolean> => {
  try {
    console.log('🗑️ [VIDEO_ACTION] Removendo vídeo:', slotId);
    
    // Verificar se é o único vídeo selecionado
    const selectedVideos = videoSlots.filter(slot => 
      slot.video_data && slot.selected_for_display
    );
    
    const videoToRemove = videoSlots.find(slot => slot.id === slotId);
    
    if (selectedVideos.length === 1 && videoToRemove?.selected_for_display) {
      toast.error('❌ Não é possível remover o único vídeo selecionado. Selecione outro vídeo primeiro.');
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

    toast.success('✅ Vídeo removido com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [VIDEO_ACTION] Erro ao remover vídeo:', error);
    toast.error('❌ Erro ao remover vídeo');
    return false;
  }
};
