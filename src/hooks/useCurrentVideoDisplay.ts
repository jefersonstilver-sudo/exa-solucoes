import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrentVideoDisplay {
  video_id: string | null;
  is_scheduled: boolean;
  priority_type: 'scheduled' | 'base' | null;
}

interface UseCurrentVideoDisplayProps {
  orderId: string;
  enabled?: boolean;
}

export const useCurrentVideoDisplay = ({ orderId, enabled = true }: UseCurrentVideoDisplayProps) => {
  const [currentVideo, setCurrentVideo] = useState<CurrentVideoDisplay | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentVideo = async () => {
    if (!orderId || !enabled) return;

    try {
      console.log('🎯 [CURRENT_VIDEO] Buscando vídeo atual para o pedido:', orderId);
      
      const { data, error } = await supabase.rpc('get_current_display_video', {
        p_pedido_id: orderId
      });

      if (error) {
        console.error('❌ [CURRENT_VIDEO] Erro ao obter vídeo atual:', error);
        return;
      }

      console.log('📺 [CURRENT_VIDEO] Resultado da RPC:', data);

      if (data && data.length > 0) {
        const videoData = data[0];
        const newCurrentVideo = {
          video_id: videoData.video_id,
          is_scheduled: videoData.is_scheduled,
          priority_type: videoData.priority_type as 'scheduled' | 'base'
        };
        
        console.log('✅ [CURRENT_VIDEO] Vídeo atual definido:', newCurrentVideo);
        setCurrentVideo(newCurrentVideo);
      } else {
        console.log('🚫 [CURRENT_VIDEO] Nenhum vídeo em exibição encontrado');
        setCurrentVideo(null);
      }
    } catch (error) {
      console.error('💥 [CURRENT_VIDEO] Erro geral ao obter vídeo atual:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentVideo();

    // Atualizar a cada minuto para mudanças de programação
    const interval = setInterval(fetchCurrentVideo, 60000);

    return () => clearInterval(interval);
  }, [orderId, enabled]);

  const isVideoCurrentlyDisplaying = (videoId: string): boolean => {
    return currentVideo?.video_id === videoId;
  };

  const getCurrentDisplayType = (videoId: string): 'displaying' | 'base' | 'scheduled' | 'none' => {
    if (!currentVideo || currentVideo.video_id !== videoId) {
      return 'none';
    }

    if (currentVideo.is_scheduled) {
      return 'displaying'; // Em exibição via programação
    }

    if (currentVideo.priority_type === 'base') {
      return 'displaying'; // Em exibição como vídeo base
    }

    return 'none';
  };

  return {
    currentVideo,
    loading,
    isVideoCurrentlyDisplaying,
    getCurrentDisplayType,
    refreshCurrentVideo: fetchCurrentVideo
  };
};