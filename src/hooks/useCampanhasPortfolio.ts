
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
  const [error, setError] = useState<string | null>(null);

  const fetchCampanhas = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Campanhas Portfolio: Buscando dados...');
      
      const { data, error } = await supabase
        .from('campanhas_portfolio')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar campanhas:', error);
        
        // Se a tabela não existir, retornar array vazio em vez de erro
        if (error.message.includes('relation "campanhas_portfolio" does not exist')) {
          console.log('⚠️ Tabela campanhas_portfolio não existe, usando dados mock');
          setCampanhas([]);
          setError('Tabela não encontrada - usando modo desenvolvimento');
          return;
        }
        
        setError(error.message);
        toast.error('Erro ao carregar portfólio');
      } else {
        console.log('✅ Campanhas portfolio carregadas:', data?.length || 0);
        setCampanhas(data || []);
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar campanhas:', error);
      setError(error?.message || 'Erro desconhecido');
      
      // Em caso de erro, usar dados mock para desenvolvimento
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampanhas();

    // Só configurar realtime se não houver erro de tabela
    if (!error?.includes('não existe')) {
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
    }
  }, [error]);

  return { campanhas, loading, error, refetch: fetchCampanhas };
};
