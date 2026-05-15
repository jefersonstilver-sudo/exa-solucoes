
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { deleteVideoFromStorage } from '@/services/videoStorageService';
import { deleteVideoWithExternalAPI } from '@/services/videoDeleteHelper';
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
      
      // 🔔 SINCRONIZAÇÃO COM API EXTERNA — Nova rota PATCH /master/{client_id}
      try {
        const ativarTitulo = (newVideoName || '').replace(/\.[^/.]+$/, '');
        const desativarTitulo = ((currentSelectedVideo as any)?.video_data?.nome || '').replace(/\.[^/.]+$/, '');

        console.log('🔔 [VIDEO_ACTION] PATCH /master ->', {
          pedido_id: videoData.pedido_id,
          ativar_master: ativarTitulo,
          desativar_master: desativarTitulo,
        });

        const { error: masterError } = await supabase.functions.invoke('update-video-master-aws', {
          body: {
            pedido_id: videoData.pedido_id,
            ativar_titulo: ativarTitulo,
            desativar_titulo: desativarTitulo || null,
          },
        });

        if (masterError) {
          console.error('❌ [VIDEO_ACTION] Erro ao trocar master na AWS:', masterError);
          throw masterError;
        }

        console.log('🎉 [VIDEO_ACTION] Master trocado com sucesso na API externa');
      } catch (apiError) {
        console.error('💥 [VIDEO_ACTION] Erro crítico ao trocar master na API externa:', apiError);
        toast.error('Erro ao sincronizar master com painéis físicos');
        throw apiError;
      }
      
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

    // Deletar arquivo do storage se existir
    if (videoToRemove.video_data?.url && videoToRemove.video_data.url !== 'pending_upload') {
      await deleteVideoFromStorage(videoToRemove.video_data.url);
    }

    // Usar helper centralizado: API externa + banco
    console.log(`🗑️ [VIDEO_ACTION] Chamando deleteVideoWithExternalAPI: slotId=${slotId}, video_id=${videoToRemove.video_id}`);
    await deleteVideoWithExternalAPI(slotId, videoToRemove.video_id);

    toast.success('✅ Vídeo removido com sucesso');
    return true;
  } catch (error: any) {
    console.error('❌ [VIDEO_ACTION] Erro inesperado:', error);
    
    if (error.message?.includes('CANNOT_REMOVE_LAST_VIDEO')) {
      toast.error('❌ Não é possível remover o último vídeo aprovado. Envie outro vídeo primeiro.');
      return false;
    }
    if (error.message?.includes('CANNOT_REMOVE_BASE_VIDEO')) {
      toast.error('❌ Não é possível remover o vídeo base. Defina outro vídeo como base primeiro.');
      return false;
    }
    
    toast.error('❌ Erro inesperado ao remover vídeo');
    return false;
  }
};
