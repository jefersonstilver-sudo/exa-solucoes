import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VideoConfig {
  id: string;
  video_principal_url: string | null;
  video_secundario_url: string | null;
  condominio_ticker_names: string[] | null;
}

export const useVideoConfig = () => {
  return useQuery({
    queryKey: ['video-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_sindico')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as VideoConfig | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: true, // Sempre buscar dados atualizados ao montar
  });
};
