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

// Último vídeo no ar de cada pedido, guardado no aparelho: a lista abre já com as miniaturas
// e depois confere no banco (se mudou, troca).
const CHAVE = 'exa-pedido-video:';
const lerGuardado = (orderId: string): VideoData | null => {
  if (!orderId) return null;
  try { const v = localStorage.getItem(CHAVE + orderId); return v ? JSON.parse(v) : null; } catch { return null; }
};
const guardar = (orderId: string, v: VideoData | null) => {
  if (!orderId) return;
  try { if (v) localStorage.setItem(CHAVE + orderId, JSON.stringify(v)); else localStorage.removeItem(CHAVE + orderId); } catch { /* nada */ }
};

export const useOrderCurrentVideoData = (orderId: string): UseOrderCurrentVideoDataReturn => {
  const [videoData, setVideoData] = useState<VideoData | null>(() => lerGuardado(orderId));
  const [loading, setLoading] = useState(() => !lerGuardado(orderId));
  const [error, setError] = useState<string | null>(null);

  const { currentVideo, loading: currentVideoLoading } = useCurrentVideoDisplay({ 
    orderId, 
    enabled: !!orderId 
  });

  useEffect(() => {
    const fetchVideoData = async () => {
      if (currentVideoLoading) return; // ainda conferindo: mantém o que estava guardado
      if (!currentVideo?.video_id) {
        setVideoData(null);
        guardar(orderId, null);
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
          const novo = { videoName: data.nome, videoUrl: data.url };
          setVideoData(novo);
          guardar(orderId, novo);
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
  }, [currentVideo, currentVideoLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    videoData,
    loading: loading || currentVideoLoading,
    error
  };
};