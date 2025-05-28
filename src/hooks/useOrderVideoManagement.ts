
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoSlot {
  id?: string;
  slot_position: number;
  video_id?: string;
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  video_data?: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
    tem_audio: boolean;
    tamanho_arquivo?: number;
    formato?: string;
  };
  rejection_reason?: string;
}

export const useOrderVideoManagement = (orderId: string) => {
  const [videoSlots, setVideoSlots] = useState<VideoSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadVideoSlots = async () => {
    if (!orderId) return;

    try {
      setLoading(true);

      const { data: pedidoVideos, error } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          slot_position,
          video_id,
          is_active,
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

      if (error) throw error;

      // Criar slots 1-4, preenchendo com dados existentes
      const slots: VideoSlot[] = [1, 2, 3, 4].map(position => {
        const existingVideo = pedidoVideos?.find(pv => pv.slot_position === position);
        
        return {
          id: existingVideo?.id,
          slot_position: position,
          video_id: existingVideo?.video_id,
          is_active: existingVideo?.is_active || false,
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
      });

      setVideoSlots(slots);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const activateVideo = async (slotId: string) => {
    try {
      const { data, error } = await supabase.rpc('activate_video', {
        p_pedido_id: orderId,
        p_pedido_video_id: slotId
      });

      if (error) throw error;

      if (data) {
        toast.success('Vídeo ativado com sucesso!');
        loadVideoSlots();
      } else {
        toast.error('Apenas vídeos aprovados podem ser ativados');
      }
    } catch (error) {
      console.error('Erro ao ativar vídeo:', error);
      toast.error('Erro ao ativar vídeo');
    }
  };

  const removeVideo = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('pedido_videos')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast.success('Vídeo removido com sucesso');
      loadVideoSlots();
    } catch (error) {
      console.error('Erro ao remover vídeo:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  const uploadVideo = async (slotPosition: number, file: File, userId: string) => {
    try {
      setUploading(true);

      // Validar vídeo usando a função do Supabase
      const validation = await validateVideoFile(file);
      if (!validation.valid) {
        toast.error(validation.errors.join(', '));
        return;
      }

      // Criar registro do vídeo
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          client_id: userId,
          nome: file.name,
          url: 'pending_upload',
          origem: 'cliente',
          status: 'ativo',
          ...validation.videoData
        })
        .select()
        .single();

      if (videoError) throw videoError;

      // Criar/atualizar entrada na tabela pedido_videos
      const { error: slotError } = await supabase
        .from('pedido_videos')
        .upsert({
          pedido_id: orderId,
          video_id: videoData.id,
          slot_position: slotPosition,
          approval_status: 'pending'
        });

      if (slotError) throw slotError;

      toast.success('Vídeo enviado para aprovação!');
      loadVideoSlots();
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload do vídeo');
    } finally {
      setUploading(false);
    }
  };

  const validateVideoFile = (file: File): Promise<{ valid: boolean; errors: string[]; videoData: any }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        const errors: string[] = [];
        const duration = Math.round(video.duration);
        const width = video.videoWidth;
        const height = video.videoHeight;
        const orientation = height > width ? 'vertical' : 'horizontal';
        
        if (duration > 15) {
          errors.push('Vídeo deve ter no máximo 15 segundos');
        }
        
        if (orientation !== 'horizontal') {
          errors.push('Vídeo deve estar em orientação horizontal');
        }
        
        URL.revokeObjectURL(url);
        
        resolve({
          valid: errors.length === 0,
          errors,
          videoData: {
            duracao: duration,
            orientacao: orientation,
            largura: width,
            altura: height,
            tamanho_arquivo: file.size,
            formato: file.type,
            tem_audio: false
          }
        });
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          valid: false,
          errors: ['Erro ao processar vídeo'],
          videoData: null
        });
      };
      
      video.src = url;
    });
  };

  useEffect(() => {
    loadVideoSlots();
  }, [orderId]);

  return {
    videoSlots,
    loading,
    uploading,
    activateVideo,
    removeVideo,
    uploadVideo,
    refreshSlots: loadVideoSlots
  };
};
