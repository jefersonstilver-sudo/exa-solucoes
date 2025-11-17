
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
      
      // 🔔 SINCRONIZAÇÃO SÍNCRONA COM API EXTERNA - Notificar TODOS os vídeos
      try {
        console.log('🔔 [VIDEO_ACTION] Iniciando sincronização síncrona com API externa...');
        
        // 1️⃣ Buscar TODOS os vídeos do pedido
        const { data: allVideos, error: videosError } = await supabase
          .from('pedido_videos')
          .select('id, video_id, is_active, selected_for_display, videos(nome)')
          .eq('pedido_id', videoData.pedido_id);

        if (videosError) {
          console.error('❌ [VIDEO_ACTION] Erro ao buscar vídeos:', videosError);
          throw videosError;
        }

        // 2️⃣ Buscar prédios do pedido
        const { data: pedidoData, error: pedidoError } = await supabase
          .from('pedidos')
          .select('lista_predios')
          .eq('id', videoData.pedido_id)
          .single();

        if (pedidoError) {
          console.error('❌ [VIDEO_ACTION] Erro ao buscar pedido:', pedidoError);
          throw pedidoError;
        }

        if (pedidoData?.lista_predios && Array.isArray(pedidoData.lista_predios) && allVideos && allVideos.length > 0) {
          console.log(`🏢 [VIDEO_ACTION] Notificando ${allVideos.length} vídeos para ${pedidoData.lista_predios.length} prédios`);
          
          // 3️⃣ Para cada prédio, notificar TODOS os vídeos
          for (const buildingId of pedidoData.lista_predios) {
            console.log(`🔔 [VIDEO_ACTION] Processando prédio ${buildingId}...`);
            
            // 4️⃣ Notificar CADA vídeo individualmente (síncrono)
            for (const video of allVideos) {
              const videoName = video.videos?.nome || 'Video';
              const isActive = video.selected_for_display && video.is_active;
              
              console.log(`📹 [VIDEO_ACTION] Notificando vídeo "${videoName}": ativo=${isActive}`);
              
              // Chamada SÍNCRONA (await) para garantir ordem
              const { data: notifyData, error: notifyError } = await supabase.functions.invoke('notify-active', {
                body: {
                  clientId: buildingId.substring(0, 4),
                  buildingUuid: buildingId,
                  titulo: videoName,
                  ativo: isActive  // true para o ativo, false para os outros
                }
              });
              
              if (notifyError) {
                console.error(`❌ [VIDEO_ACTION] Erro ao notificar "${videoName}":`, notifyError);
                throw notifyError; // Bloquear se falhar
              }
              
              console.log(`✅ [VIDEO_ACTION] Vídeo "${videoName}" notificado com ativo=${isActive}`);
            }
            
            console.log(`✅ [VIDEO_ACTION] Prédio ${buildingId} sincronizado com sucesso`);
          }
          
          console.log('🎉 [VIDEO_ACTION] Sincronização completa com API externa');
        } else {
          console.warn('⚠️ [VIDEO_ACTION] Nenhum prédio ou vídeo encontrado para notificar');
        }
      } catch (apiError) {
        console.error('💥 [VIDEO_ACTION] Erro crítico ao notificar API externa:', apiError);
        toast.error('Erro ao sincronizar com painéis físicos');
        throw apiError; // Bloquear fluxo em caso de erro
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
