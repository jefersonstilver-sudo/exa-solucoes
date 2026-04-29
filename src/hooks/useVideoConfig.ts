import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VideoConfigRaw {
  id: string;
  video_principal_url: string | null;
  video_secundario_url: string | null;
  condominio_ticker_names: string[] | null;
  updated_at?: string | null;
}

export interface VideoConfig {
  id: string;
  video_principal_url: string | null;
  video_secundario_url: string | null;
  condominio_ticker_names: string[] | null;
}

/** Adiciona um cache-buster baseado em updated_at para evitar vídeo antigo no Safari/iPhone. */
const withVersion = (url: string | null, version: string | null | undefined): string | null => {
  if (!url) return url;
  if (!version) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('v', String(new Date(version).getTime() || version));
    return u.toString();
  } catch {
    return url + (url.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(String(version));
  }
};

export const useVideoConfig = () => {
  return useQuery<VideoConfig | null>({
    queryKey: ['video-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_sindico')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      const raw = data as VideoConfigRaw | null;
      if (!raw) return null;

      const v = raw.updated_at;
      return {
        id: raw.id,
        condominio_ticker_names: raw.condominio_ticker_names,
        video_principal_url: withVersion(raw.video_principal_url, v),
        video_secundario_url: withVersion(raw.video_secundario_url, v),
      };
    },
    // Sem cache longo: homepage deve refletir alterações imediatamente
    staleTime: 0,
    gcTime: 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
