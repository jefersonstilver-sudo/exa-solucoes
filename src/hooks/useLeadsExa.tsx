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

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_leads_exa_secure');

      if (error) {
        console.error('Erro ao buscar leads EXA:', error);
        toast.error('Erro ao carregar leads EXA');
      } else {
        setLeads(data || []);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const markAsContacted = async (leadId: string) => {
    try {
      const { data, error } = await supabase.rpc('mark_exa_lead_contacted_secure', {
        p_lead_id: leadId
      });

      if (error) {
        console.error('Erro ao marcar como contatado:', error);
        toast.error('Erro ao marcar como contatado');
      } else if ((data as any)?.success) {
        toast.success('Lead marcado como contatado');
        fetchLeads();
      } else {
        toast.error((data as any)?.error || 'Erro ao marcar como contatado');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro inesperado');
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const createLead = async (leadData: Omit<LeadExa, 'id' | 'created_at' | 'updated_at' | 'contato_realizado' | 'status'>) => {
    try {
      console.log('🔄 Criando novo lead EXA:', leadData);
      
      const { error } = await supabase.functions.invoke('submit-exa-lead', {
        body: leadData
      });

      if (error) {
        console.error('❌ Erro ao criar lead EXA:', error);
        toast.error('Erro ao enviar formulário: ' + error.message);
        throw error;
      } else {
        toast.success('Formulário enviado com sucesso! Entraremos em contato em breve.');
        fetchLeads();
      }
    } catch (error) {
      console.error('❌ Erro ao criar lead EXA:', error);
      throw error;
    }
  };

  return {
    leads,
    loading,
    fetchLeads,
    markAsContacted,
    createLead
  };
};