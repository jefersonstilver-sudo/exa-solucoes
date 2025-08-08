import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentVideoDisplay } from './useCurrentVideoDisplay';

interface VideoData {
  videoName: string;
  videoUrl: string;
}

interface UseOrderCurrentVideoDataReturn {
  videoData: VideoData | null;
  loading: boolean;
  error: string | null;
}

export const useOrderCurrentVideoData = (orderId: string): UseOrderCurrentVideoDataReturn => {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentVideo, loading: currentVideoLoading } = useCurrentVideoDisplay({ 
    orderId, 
    enabled: !!orderId 
  });

  useEffect(() => {
    const fetchVideoData = async () => {
      if (currentVideoLoading || !currentVideo?.video_id) {
        setVideoData(null);
        setLoading(false);
        return;
      }

      try {
        console.log('📹 [VIDEO_DATA] Buscando dados do vídeo:', currentVideo.video_id);
        
        const { data, error } = await supabase
          .from('videos')
          .select('nome, url')
          .eq('id', currentVideo.video_id)
          .single();

        if (error) {
          console.error('❌ [VIDEO_DATA] Erro ao buscar dados do vídeo:', error);
          setError('Erro ao carregar dados do vídeo');
          setVideoData(null);
          return;
        }

        if (data) {
          console.log('✅ [VIDEO_DATA] Dados do vídeo carregados:', data);
          setVideoData({
            videoName: data.nome,
            videoUrl: data.url
          });
          setError(null);
        }
      } catch (err) {
        console.error('💥 [VIDEO_DATA] Erro geral:', err);
        setError('Erro inesperado ao carregar vídeo');
        setVideoData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [currentVideo, currentVideoLoading]);

  return {
    videoData,
    loading: loading || currentVideoLoading,
    error
  };
};