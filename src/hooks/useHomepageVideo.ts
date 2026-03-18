import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useHomepageVideo = () => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [horizontalVideoUrl, setHorizontalVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('configuracoes_sindico')
          .select('video_homepage_url, video_homepage_horizontal_url')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao buscar vídeo da homepage:', error);
          return;
        }

        if (data?.video_homepage_url) {
          setVideoUrl(data.video_homepage_url);
        }
        if (data?.video_homepage_horizontal_url) {
          setHorizontalVideoUrl(data.video_homepage_horizontal_url);
        }
      } catch (error) {
        console.error('Erro ao carregar vídeo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoUrl();
  }, []);

  return { videoUrl, horizontalVideoUrl, loading };
};
