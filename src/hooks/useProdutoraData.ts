
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PortfolioItem {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  url_video: string;
  created_at: string;
}

export interface LeadProdutora {
  id: string;
  nome: string;
  empresa: string;
  whatsapp: string;
  email: string;
  tipo_video: string;
  objetivo: string;
  agendar_cafe: boolean;
  contato_realizado: boolean;
  created_at: string;
}

export const usePortfolioData = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolioItems = async () => {
    try {
      setLoading(true);
      console.log('📊 Portfolio: Buscando dados...');
      
      const { data, error } = await supabase
        .from('portfolio_produtora')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar portfólio:', error);
        toast.error('Erro ao carregar portfólio');
      } else {
        console.log('✅ Portfólio carregado:', data?.length || 0, 'itens');
        setPortfolioItems(data || []);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar portfólio:', error);
      toast.error('Erro ao carregar portfólio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioItems();
  }, []);

  return { portfolioItems, loading, refetch: fetchPortfolioItems };
};

export const useLeadsProdutoraData = () => {
  const [leads, setLeads] = useState<LeadProdutora[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      console.log('📊 Leads Produtora: Buscando dados...');
      
      const { data, error } = await supabase
        .from('leads_produtora')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar leads:', error);
        toast.error('Erro ao carregar leads: ' + error.message);
      } else {
        console.log('✅ Leads carregados:', data?.length || 0);
        setLeads(data || []);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const markAsContacted = async (leadId: string) => {
    try {
      console.log('🔄 Marcando lead como contatado:', leadId);
      
      const { error } = await supabase
        .from('leads_produtora')
        .update({ contato_realizado: true })
        .eq('id', leadId);

      if (error) {
        console.error('❌ Erro ao marcar contato:', error);
        toast.error('Erro ao marcar como contatado: ' + error.message);
        throw error;
      } else {
        toast.success('Lead marcado como contatado!');
        fetchLeads(); // Recarregar dados
      }
    } catch (error) {
      console.error('❌ Erro ao marcar contato:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchLeads();

    // Configurar realtime para novos leads
    console.log('📡 Leads Produtora: Configurando realtime...');
    const channel = supabase
      .channel('leads-produtora-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'leads_produtora' 
        }, 
        (payload) => {
          console.log('📡 Leads Produtora: Dados atualizados em tempo real', payload);
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { leads, loading, refetch: fetchLeads, markAsContacted };
};
