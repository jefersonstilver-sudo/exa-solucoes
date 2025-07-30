import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CampanhaPortfolio {
  id: string;
  titulo: string;
  categoria: string;
  descricao?: string;
  url_video: string;
  created_at: string;
}

export const usePortfolioProdutora = () => {
  const [campanhas, setCampanhas] = useState<CampanhaPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampanhas = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Portfolio Admin: Buscando dados...');
      
      const { data, error } = await supabase
        .from('portfolio_produtora')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar campanhas:', error);
        setError(error.message);
        toast.error('Erro ao carregar portfólio');
      } else {
        console.log('✅ Campanhas portfolio carregadas:', data?.length || 0);
        setCampanhas(data || []);
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar campanhas:', error);
      setError(error?.message || 'Erro desconhecido');
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  };

  const createCampanha = async (data: Omit<CampanhaPortfolio, 'id' | 'created_at'>) => {
    try {
      console.log('➕ Criando nova campanha:', data);
      
      const { data: newCampanha, error } = await supabase
        .from('portfolio_produtora')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar campanha:', error);
        toast.error('Erro ao criar vídeo do portfólio');
        return false;
      }

      console.log('✅ Campanha criada:', newCampanha);
      setCampanhas(prev => [newCampanha, ...prev]);
      toast.success('Vídeo adicionado ao portfólio com sucesso!');
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao criar campanha:', error);
      toast.error('Erro ao criar vídeo do portfólio');
      return false;
    }
  };

  const updateCampanha = async (id: string, data: Partial<Omit<CampanhaPortfolio, 'id' | 'created_at'>>) => {
    try {
      console.log('✏️ Atualizando campanha:', id, data);
      
      const { data: updatedCampanha, error } = await supabase
        .from('portfolio_produtora')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar campanha:', error);
        toast.error('Erro ao atualizar vídeo do portfólio');
        return false;
      }

      console.log('✅ Campanha atualizada:', updatedCampanha);
      setCampanhas(prev => prev.map(c => c.id === id ? updatedCampanha : c));
      toast.success('Vídeo atualizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar campanha:', error);
      toast.error('Erro ao atualizar vídeo do portfólio');
      return false;
    }
  };

  const deleteCampanha = async (id: string) => {
    try {
      console.log('🗑️ Deletando campanha:', id);
      
      const { error } = await supabase
        .from('portfolio_produtora')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao deletar campanha:', error);
        toast.error('Erro ao deletar vídeo do portfólio');
        return false;
      }

      console.log('✅ Campanha deletada:', id);
      setCampanhas(prev => prev.filter(c => c.id !== id));
      toast.success('Vídeo removido do portfólio com sucesso!');
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao deletar campanha:', error);
      toast.error('Erro ao deletar vídeo do portfólio');
      return false;
    }
  };

  useEffect(() => {
    fetchCampanhas();

    // Configurar realtime
    console.log('📡 Portfolio Admin: Configurando realtime...');
    const channel = supabase
      .channel('portfolio-produtora-admin-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'portfolio_produtora' 
        }, 
        (payload) => {
          console.log('📡 Portfolio Admin: Dados atualizados em tempo real', payload);
          fetchCampanhas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    campanhas, 
    loading, 
    error, 
    createCampanha,
    updateCampanha,
    deleteCampanha,
    refetch: fetchCampanhas 
  };
};