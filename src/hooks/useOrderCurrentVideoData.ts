import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentVideoDisplay } from './useCurrentVideoDisplay';

interface VideoData {
  id: string;
  nome: string;
  url: string;
  duracao: number;
  orientacao: string;
}

interface UseOrderCurrentVideoDataProps {
  orderId: string;
  enabled?: boolean;
}

export const useOrderCurrentVideoData = ({ orderId, enabled = true }: UseOrderCurrentVideoDataProps) => {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentVideo, loading: currentVideoLoading } = useCurrentVideoDisplay({ 
    orderId, 
    enabled 
  });

  const fetchVideoData = async (videoId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('videos')
        .select('id, nome, url, duracao, orientacao')
        .eq('id', videoId)
        .single();

      if (queryError) {
        console.error('❌ [VIDEO_DATA] Erro ao buscar dados do vídeo:', queryError);
        setError('Erro ao carregar dados do vídeo');
        return;
      }

      setVideoData(data);
    } catch (err) {
      console.error('💥 [VIDEO_DATA] Erro geral:', err);
      setError('Erro inesperado ao carregar vídeo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled || currentVideoLoading) return;

    if (currentVideo?.video_id) {
      fetchVideoData(currentVideo.video_id);
    } else {
      setVideoData(null);
      setLoading(false);
    }
  }, [currentVideo?.video_id, currentVideoLoading, enabled]);

  return {
    videoData,
    loading: loading || currentVideoLoading,
    error,
    currentVideo,
    refreshVideoData: () => {
      if (currentVideo?.video_id) {
        fetchVideoData(currentVideo.video_id);
      }
    }
  };
};