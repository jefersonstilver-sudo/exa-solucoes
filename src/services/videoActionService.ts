
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { deleteVideoFromStorage } from '@/services/videoStorageService';
import { VideoSlot } from '@/types/videoManagement';
// Removed n8n integration

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

    // Buscar vídeo atualmente selecionado do mesmo pedido para webhook
    const { data: currentSelectedVideo } = await supabase
      .from('pedido_videos')
      .select('video_data:videos(nome)')
      .eq('pedido_id', videoData.pedido_id)
      .eq('selected_for_display', true)
      .single();

    // Buscar lista de prédios do pedido para webhook
    const { data: pedidoData } = await supabase
      .from('pedidos')
      .select('lista_predios')
      .eq('id', videoData.pedido_id)
      .single();

    console.log('✅ [VIDEO_ACTION] Vídeo aprovado, usando função corrigida para seleção');
    
    // Usar a função RPC transacional que faz a troca com lock e consistência
    const { data, error } = await supabase.rpc('set_base_video_enhanced' as any, {
      p_pedido_video_id: slotId
    });

    if (error) {
      console.error('❌ [VIDEO_ACTION] Erro na função RPC set_base_video_enhanced:', error);
      throw error;
    }

    const rpcResult = data as any;
    if (rpcResult?.success === true) {
      console.log('✅ [VIDEO_ACTION] Vídeo selecionado com sucesso (via set_base_video_enhanced)');
      
      // Buscar nome do novo vídeo selecionado
      const { data: newVideoInfo } = await supabase
        .from('pedido_videos')
        .select('video_data:videos(nome)')
        .eq('id', slotId)
        .single();

      const newVideoName = newVideoInfo?.video_data?.nome;
      
      // API externa será sincronizada automaticamente pelo videoBaseService.ts
      console.log('✅ [VIDEO_ACTION] API externa será sincronizada automaticamente');
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess(newVideoName);
      }
      
      toast.success('✅ Vídeo selecionado para exibição!');
      return true;
    } else {
      console.error('❌ [VIDEO_ACTION] Função RPC retornou falha:', rpcResult);
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

    // 🆕 FASE 5: Deletar da AWS ANTES de deletar do Supabase
    if (videoToRemove.video_id) {
      console.log('🌐 [VIDEO_ACTION] Deletando vídeo da AWS em todos os prédios...');
      
      try {
        // Buscar pedido_id do slot
        const { data: slotData } = await supabase
          .from('pedido_videos')
          .select('pedido_id')
          .eq('id', slotId)
          .single();

        if (slotData?.pedido_id) {
          const { data, error } = await supabase.functions.invoke('delete-video-from-external-api', {
            body: {
              video_id: videoToRemove.video_id,
              pedido_id: slotData.pedido_id
            }
          });

          if (error) {
            console.warn('⚠️ [VIDEO_ACTION] Falha ao deletar vídeo da AWS:', error);
            // NÃO bloquear - continuar com deleção local
          } else {
            console.log('✅ [VIDEO_ACTION] Vídeo deletado da AWS:', data);
          }
        }
      } catch (awsError) {
        console.warn('⚠️ [VIDEO_ACTION] Erro ao chamar API AWS:', awsError);
        // NÃO bloquear - continuar com deleção local
      }
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
