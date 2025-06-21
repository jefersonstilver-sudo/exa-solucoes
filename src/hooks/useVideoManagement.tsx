
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { uploadVideo } from '@/services/videoUploadService';
import { validateVideoUploadPermission } from '@/services/videoUploadSecurityService';
import { VideoSlot } from '@/types/videoManagement';

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
        const { data, error } = await supabase
          .from('pedido_videos')
          .select(`
            id,
            slot_position,
            approval_status,
            is_active,
            selected_for_display,
            created_at,
            approved_at,
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
          .eq('pedido_id', orderId)
          .order('slot_position');

        if (error) throw error;

        const formattedSlots: VideoSlot[] = data?.map(slot => ({
          id: slot.id,
          slot_position: slot.slot_position,
          video_id: slot.videos?.id,
          is_active: slot.is_active,
          selected_for_display: slot.selected_for_display,
          approval_status: slot.approval_status as 'pending' | 'approved' | 'rejected',
          video_data: slot.videos ? {
            id: slot.videos.id,
            nome: slot.videos.nome,
            url: slot.videos.url,
            duracao: slot.videos.duracao,
            orientacao: slot.videos.orientacao,
            tem_audio: slot.videos.tem_audio,
            tamanho_arquivo: slot.videos.tamanho_arquivo,
            formato: slot.videos.formato
          } : undefined,
          rejection_reason: slot.rejection_reason
        })) || [];

        setVideoSlots(formattedSlots);
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
        window.location.reload();
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
      window.location.reload();
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

      toast.success('Vídeo selecionado para exibição!');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao selecionar vídeo:', error);
      toast.error('Erro ao selecionar vídeo');
    }
  };

  // Download de vídeo
  const handleDownload = (videoUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    videoSlots,
    uploading,
    uploadProgress,
    handleUpload,
    handleActivate,
    handleRemove,
    handleSelectForDisplay,
    handleDownload
  };
};
