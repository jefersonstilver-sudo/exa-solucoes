
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CampanhaPortfolio {
  id: string;
  titulo: string;
  cliente: string;
  categoria: string;
  descricao?: string;
  url_video: string;
  capa_url?: string;
  created_at: string;
  updated_at: string;
}

export const useCampanhasPortfolio = () => {
  const [campanhas, setCampanhas] = useState<CampanhaPortfolio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampanhas = async () => {
    try {
      setLoading(true);
      console.log('📊 Campanhas Portfolio: Buscando dados...');
      
      const { data, error } = await supabase
        .from('campanhas_portfolio')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar campanhas:', error);
        toast.error('Erro ao carregar portfólio');
      } else {
        console.log('✅ Campanhas portfolio carregadas:', data?.length || 0);
        setCampanhas(data || []);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar campanhas:', error);
      toast.error('Erro ao carregar portfólio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampanhas();

    // Configurar realtime
    console.log('📡 Campanhas Portfolio: Configurando realtime...');
    const channel = supabase
      .channel('campanhas-portfolio-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'campanhas_portfolio' 
        }, 
        (payload) => {
          console.log('📡 Campanhas Portfolio: Dados atualizados em tempo real', payload);
          fetchCampanhas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { campanhas, loading, refetch: fetchCampanhas };
};
