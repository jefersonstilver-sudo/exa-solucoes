
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
    try {
      // Derivar títulos a partir do estado atual (fallback para DB)
      const currentSelectedInState = videoSlots.find(s => s.selected_for_display);
      const newSelectedInState = videoSlots.find(s => s.id === slotId);
      const oldTitleFromState = currentSelectedInState?.video_data?.nome
        ? normalizeTitle(currentSelectedInState.video_data.nome)
        : undefined;
      const newTitleFromState = newSelectedInState?.video_data?.nome
        ? normalizeTitle(newSelectedInState.video_data.nome)
        : undefined;

      // Buscar dados do pedido e nomes via DB como fallback
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
        .update({ selected_for_display: false })
        .eq('pedido_id', orderId);

      // Depois marcar o selecionado
      const { error } = await supabase
        .from('pedido_videos')
        .update({ selected_for_display: true })
        .eq('id', slotId);

      if (error) throw error;

      // Determinar buildingIds e títulos com melhor esforço
      const buildingIds = Array.isArray(pedidoResult.data?.lista_predios)
        ? (pedidoResult.data!.lista_predios as string[])
        : [];
      const oldTitleDb = currentSelectedResult.data?.video_data?.nome
        ? normalizeTitle(currentSelectedResult.data.video_data.nome)
        : undefined;
      const newTitleDb = newVideoResult.data?.video_data?.nome
        ? normalizeTitle(newVideoResult.data.video_data.nome)
        : undefined;

      const oldTitle = oldTitleFromState ?? oldTitleDb;
      const newTitle = newTitleFromState ?? newTitleDb;

      // Enviar webhooks após sucesso no Supabase
      console.log('🔍 [WEBHOOK] Dados para webhooks (pós-update):', {
        buildingIds,
        oldFromState: oldTitleFromState,
        newFromState: newTitleFromState,
        oldFromDb: oldTitleDb,
        newFromDb: newTitleDb,
        finalOldTitle: oldTitle,
        finalNewTitle: newTitle
      });

      if (buildingIds.length > 0) {
        // Sempre confirmar ativação do novo vídeo
        if (newTitle) {
          console.log('📤 [WEBHOOK] Enviando ativação via proxy para:', { newTitle, buildingIds });
          toggleForBuildings({
            buildingIds,
            toActivateTitle: newTitle
          }).catch(err => {
            console.error('❌ [WEBHOOK] Erro no webhook de ativação:', err);
          });
        } else {
          console.warn('⚠️ [WEBHOOK] Título do novo vídeo não encontrado, pulando ativação');
        }

        // Enviar desativação apenas se for título diferente e existir um antigo
        if (oldTitle && newTitle && oldTitle !== newTitle) {
          console.log('📤 [WEBHOOK] Enviando desativação via proxy para:', { oldTitle, buildingIds });
          toggleForBuildings({
            buildingIds,
            toDeactivateTitle: oldTitle
          }).catch(err => {
            console.error('❌ [WEBHOOK] Erro no webhook de desativação:', err);
          });
        } else {
          console.log('ℹ️ [WEBHOOK] Não enviando desativação:', {
            hasOldTitle: !!oldTitle,
            hasNewTitle: !!newTitle,
            sameTitle: oldTitle === newTitle
          });
        }
      } else {
        console.warn('⚠️ [WEBHOOK] Lista de prédios vazia ou não encontrada. Webhooks não enviados.', {
          pedidoExists: !!pedidoResult.data,
          prediosField: pedidoResult.data?.lista_predios
        });
      }

      toast.success('Vídeo selecionado para exibição!');
      const slots = await loadVideoSlots(orderId);
      setVideoSlots(slots);
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
