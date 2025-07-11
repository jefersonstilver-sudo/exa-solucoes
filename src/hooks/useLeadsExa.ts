import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadExa {
  id: string;
  nome_completo: string;
  nome_empresa: string;
  cargo: string;
  whatsapp: string;
  objetivo?: string;
  status: string;
  contato_realizado: boolean;
  created_at: string;
  updated_at: string;
}

export const useLeadsExa = () => {
  const [leads, setLeads] = useState<LeadExa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Leads EXA: Buscando dados...');
      
      const { data, error } = await supabase
        .from('leads_exa')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar leads EXA:', error);
        
        // Se a tabela não existir, retornar array vazio
        if (error.message.includes('relation "leads_exa" does not exist')) {
          console.log('⚠️ Tabela leads_exa não existe, usando modo desenvolvimento');
          setLeads([]);
          setError('Tabela não encontrada - usando modo desenvolvimento');
          return;
        }
        
        setError(error.message);
        toast.error('Erro ao carregar leads de EXA');
      } else {
        console.log('✅ Leads EXA carregados:', data?.length || 0);
        setLeads(data || []);
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar leads EXA:', error);
      setError(error?.message || 'Erro desconhecido');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsContacted = async (leadId: string) => {
    try {
      console.log('🔄 Marcando lead EXA como contatado:', leadId);
      
      const { error } = await supabase
        .from('leads_exa')
        .update({ contato_realizado: true })
        .eq('id', leadId);

      if (error) {
        console.error('❌ Erro ao marcar contato:', error);
        toast.error('Erro ao marcar como contatado: ' + error.message);
        throw error;
      } else {
        toast.success('Lead EXA marcado como contatado!');
        fetchLeads();
      }
    } catch (error) {
      console.error('❌ Erro ao marcar contato:', error);
      throw error;
    }
  };

  const createLead = async (leadData: Omit<LeadExa, 'id' | 'created_at' | 'updated_at' | 'status' | 'contato_realizado'>) => {
    try {
      console.log('🔄 Criando novo lead EXA:', leadData);
      
      const { data, error } = await supabase
        .from('leads_exa')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar lead EXA:', error);
        toast.error('Erro ao enviar formulário: ' + error.message);
        throw error;
      } else {
        toast.success('Formulário enviado com sucesso! Entraremos em contato em breve.');
        fetchLeads();
        return data;
      }
    } catch (error) {
      console.error('❌ Erro ao criar lead EXA:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchLeads();

    // Só configurar realtime se não houver erro de tabela
    if (!error?.includes('não existe')) {
      console.log('📡 Leads EXA: Configurando realtime...');
      const channel = supabase
        .channel('leads-exa-realtime')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'leads_exa' 
          }, 
          (payload) => {
            console.log('📡 Leads EXA: Dados atualizados em tempo real', payload);
            fetchLeads();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [error]);

  return { leads, loading, error, refetch: fetchLeads, markAsContacted, createLead };
};