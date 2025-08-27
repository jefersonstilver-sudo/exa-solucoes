
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { uploadVideo } from '@/services/videoUploadService';
import { validateVideoUploadPermission } from '@/services/videoUploadSecurityService';
import { VideoSlot } from '@/types/videoManagement';
import { loadVideoSlots } from '@/services/videoSlotService';
import { setBaseVideo } from '@/services/videoBaseService';
import { normalizeTitle, toggleForBuildings } from '@/services/videoToggleWebhookService';

interface UseVideoManagementProps {
  orderId: string;
  userId: string;
  orderStatus: string;
}

export const useVideoManagement = ({ orderId, userId, orderStatus }: UseVideoManagementProps) => {
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});

  // Carregar slots de vídeo
  useEffect(() => {
    const fetchVideoSlots = async () => {
      try {
        const slots = await loadVideoSlots(orderId);
        setVideoSlots(slots);
      } catch (error) {
        console.error('Erro ao carregar slots:', error);
        toast.error('Erro ao carregar vídeos');
      }
    };

    if (orderId) {
      fetchVideoSlots();
    }
  }, [orderId]);

  // Upload de vídeo com validação de segurança
  const handleUpload = async (slotPosition: number, file: File, title: string) => {
    try {
      // Validação prévia de segurança
      const securityCheck = await validateVideoUploadPermission(orderId);
      if (!securityCheck.canUpload) {
        toast.error(`Upload bloqueado: ${securityCheck.reason}`);
        return;
      }

      setUploading(true);
      setUploadProgress(prev => ({ ...prev, [slotPosition]: 0 }));

      const success = await uploadVideo(
        slotPosition,
        file,
        userId,
        orderId,
        (progress) => {
          setUploadProgress(prev => ({ ...prev, [slotPosition]: progress }));
        },
        title
      );

      if (success) {
        // Recarregar slots após upload bem-sucedido
        const slots = await loadVideoSlots(orderId);
        setVideoSlots(slots);
      }

    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do vídeo');
    } finally {
      setUploading(false);
      setUploadProgress(prev => ({ ...prev, [slotPosition]: 0 }));
    }
  };

  // Ativar vídeo
  const handleActivate = async (slotId: string) => {
    try {
      const { error } = await supabase.rpc('activate_video', {
        p_pedido_id: orderId,
        p_pedido_video_id: slotId
      });

      if (error) throw error;

      toast.success('Vídeo ativado com sucesso!');
      const slots = await loadVideoSlots(orderId);
      setVideoSlots(slots);
    } catch (error) {
      console.error('Erro ao ativar vídeo:', error);
      toast.error('Erro ao ativar vídeo');
    }
  };

  // Remover vídeo
  const handleRemove = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('pedido_videos')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast.success('Vídeo removido com sucesso!');
      setVideoSlots(prev => prev.filter(slot => slot.id !== slotId));
    } catch (error) {
      console.error('Erro ao remover vídeo:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  // Selecionar para exibição
  const handleSelectForDisplay = async (slotId: string) => {
    console.log('🔄 [HOOK] handleSelectForDisplay iniciado:', { slotId, orderId });
    
    try {
      // Buscar vídeo atualmente selecionado e dados do pedido
      const [currentSelectedResult, pedidoResult, newVideoResult] = await Promise.all([
        supabase
          .from('pedido_videos')
          .select('video_data:videos(nome)')
          .eq('pedido_id', orderId)
          .eq('selected_for_display', true)
          .single(),
        supabase
          .from('pedidos')
          .select('lista_predios')
          .eq('id', orderId)
          .single(),
        supabase
          .from('pedido_videos')
          .select('video_data:videos(nome)')
          .eq('id', slotId)
          .single()
      ]);

      // Primeiro, desmarcar todos os outros
      await supabase
        .from('pedido_videos')
        .update({ selected_for_display: false, is_base_video: false })
        .eq('pedido_id', orderId);

      // Depois marcar o selecionado
      const { error } = await supabase
        .from('pedido_videos')
        .update({ selected_for_display: true, is_base_video: true })
        .eq('id', slotId);

      if (error) throw error;

      // Enviar webhooks após sucesso no Supabase
      if (pedidoResult.data?.lista_predios) {
        const buildingIds = pedidoResult.data.lista_predios as string[];
        const oldVideoName = currentSelectedResult.data?.video_data?.nome;
        const newVideoName = newVideoResult.data?.video_data?.nome;
        
        const oldTitle = oldVideoName ? normalizeTitle(oldVideoName) : undefined;
        const newTitle = newVideoName ? normalizeTitle(newVideoName) : undefined;
        
        console.log('🚀 [WEBHOOK] Enviando webhooks para seleção:', { 
          buildingIdsCount: buildingIds.length, 
          oldTitle, 
          newTitle,
          orderId,
          slotId 
        });
        
        // CRÍTICO: Sempre enviar webhooks para DESATIVAR o antigo E ATIVAR o novo
        // Isso garante que o sistema externo sempre saiba sobre as trocas
        console.log('📤 [WEBHOOK] Preparando envio - ativação:', newTitle, 'desativação:', oldTitle);
        
        // Enviar ambos os webhooks sempre que há troca de vídeo
        toggleForBuildings({
          buildingIds,
          toDeactivateTitle: oldTitle, // Pode ser undefined se não há vídeo anterior
          toActivateTitle: newTitle     // Sempre deve haver novo título
        }).catch(error => {
          console.error('❌ [WEBHOOK] Erro ao enviar webhooks de troca:', error);
        });
      } else {
        console.warn('⚠️ [WEBHOOK] Lista de prédios não encontrada');
      }

      toast.success('Vídeo selecionado para exibição!');
      
      // Recarregar slots e verificar se a atualização funcionou
      console.log('🔄 [HOOK] Recarregando slots após seleção...');
      const slots = await loadVideoSlots(orderId);
      
      console.log('📊 [HOOK] Slots carregados após seleção:', {
        totalSlots: slots.length,
        slotsData: slots.map(slot => ({
          position: slot.slot_position,
          hasVideo: !!slot.video_data,
          videoName: slot.video_data?.nome,
          selectedForDisplay: slot.selected_for_display,
          slotId: slot.id
        }))
      });
      
      setVideoSlots(slots);
      console.log('✅ [HOOK] Estado atualizado com novos slots');
    } catch (error) {
      console.error('Erro ao selecionar vídeo:', error);
      toast.error('Erro ao selecionar vídeo');
    }
  };

  // Download de vídeo
  const handleDownload = (videoUrl: string, fileName: string) => {
    window.open(videoUrl, '_blank');
  };

  // Definir vídeo base
  const handleSetBaseVideo = async (slotId: string) => {
    try {
      const success = await setBaseVideo(slotId);
      if (success) {
        // Recarregar slots para refletir mudanças
        const slots = await loadVideoSlots(orderId);
        setVideoSlots(slots);
      }
    } catch (error) {
      console.error('Erro ao definir vídeo base:', error);
      toast.error('Erro ao definir vídeo base');
    }
  };

  return {
    videoSlots,
    uploading,
    uploadProgress,
    handleUpload,
    handleActivate,
    handleRemove,
    handleSelectForDisplay,
    handleDownload,
    handleSetBaseVideo
  };
};
