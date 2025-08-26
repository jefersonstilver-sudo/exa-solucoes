
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { deleteVideoFromStorage } from '@/services/videoStorageService';
import { VideoSlot } from '@/types/videoManagement';
import { toggleForBuildings, getBuildingIdsForOrder } from '@/services/videoToggleApiService';

export const selectVideoForDisplay = async (
  slotId: string, 
  onSuccess?: (videoName?: string) => void
): Promise<boolean> => {
  try {
    console.log('🔄 [VIDEO_ACTION] Iniciando seleção de vídeo:', slotId);
    
    // NOVA VALIDAÇÃO: Verificar se o vídeo está aprovado antes de selecionar
    const { data: videoData, error: checkError } = await supabase
      .from('pedido_videos')
      .select('approval_status, pedido_id, videos(nome)')
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

    // Get current selected video BEFORE making the change
    const { data: currentSelected } = await supabase
      .from('pedido_videos')
      .select('id, videos(nome)')
      .eq('pedido_id', videoData.pedido_id)
      .eq('selected_for_display', true)
      .maybeSingle();

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
      
      // Send webhook notifications after successful selection
      try {
        const buildingIds = await getBuildingIdsForOrder(videoData.pedido_id);
        
        if (buildingIds.length > 0) {
          // Deactivate previous video if it's different from the new one
          if (currentSelected && currentSelected.id !== slotId && currentSelected.videos?.nome) {
            console.log('📡 [VIDEO_ACTION] Deactivating previous video:', currentSelected.videos.nome);
            await toggleForBuildings(currentSelected.videos.nome, false, buildingIds);
          }
          
          // Activate new video
          if (videoData.videos?.nome) {
            console.log('📡 [VIDEO_ACTION] Activating new video:', videoData.videos.nome);
            await toggleForBuildings(videoData.videos.nome, true, buildingIds);
          }
        }
      } catch (webhookError) {
        // Don't block the UI if webhook fails
        console.error('⚠️ [VIDEO_ACTION] Webhook error (non-blocking):', webhookError);
        toast.warning('Vídeo selecionado, mas houve um problema na sincronização com os prédios');
      }
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess(videoData.videos?.nome);
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
    
    const videoToRemove = videoSlots.find(slot => slot.id === slotId);
    
    if (!videoToRemove) {
      toast.error('❌ Vídeo não encontrado');
      return false;
    }

    // Deletar arquivo do storage se existir
    if (videoToRemove.video_data?.url && videoToRemove.video_data.url !== 'pending_upload') {
      await deleteVideoFromStorage(videoToRemove.video_data.url);
    }

    // Deletar do banco - o trigger prevent_last_video_removal fará a validação
    const { error } = await supabase
      .from('pedido_videos')
      .delete()
      .eq('id', slotId);

    if (error) {
      console.error('❌ [VIDEO_ACTION] Erro ao remover vídeo:', error);
      
      // Verificar se é erro de proteção do último vídeo
      if (error.message?.includes('CANNOT_REMOVE_LAST_VIDEO')) {
        toast.error('❌ Não é possível remover o último vídeo aprovado. Envie outro vídeo primeiro.');
        return false;
      }
      
      // Verificar se é erro de proteção do vídeo base
      if (error.message?.includes('CANNOT_REMOVE_BASE_VIDEO')) {
        toast.error('❌ Não é possível remover o vídeo base. Defina outro vídeo como base primeiro.');
        return false;
      }
      
      toast.error('❌ Erro ao remover vídeo');
      return false;
    }

    toast.success('✅ Vídeo removido com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [VIDEO_ACTION] Erro inesperado:', error);
    toast.error('❌ Erro inesperado ao remover vídeo');
    return false;
  }
};
