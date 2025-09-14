import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadLinkae {
  id: string;
  nome_completo: string;
  nome_empresa: string;
  cargo: string;
  whatsapp: string;
  objetivo: string;
  status: string;
  contato_realizado: boolean;
  created_at: string;
  updated_at: string;
}

export const useLeadsLinkae = () => {
  const [leads, setLeads] = useState<LeadLinkae[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_leads_linkae_secure');

      if (error) {
        console.error('Erro ao buscar leads Linkae:', error);
        toast.error('Erro ao carregar leads Linkae');
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
      const { data, error } = await supabase.rpc('mark_linkae_lead_contacted_secure', {
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

  const createLead = async (leadData: Omit<LeadLinkae, 'id' | 'created_at' | 'updated_at' | 'contato_realizado' | 'status'>) => {
    try {
      console.log('🔄 Criando novo lead Linkae:', leadData);
      
      const { error } = await supabase.functions.invoke('submit-linkae-lead', {
        body: leadData
      });

      if (error) {
        console.error('❌ Erro ao criar lead Linkae:', error);
        toast.error('Erro ao enviar formulário: ' + error.message);
        throw error;
      } else {
        toast.success('Formulário enviado com sucesso! Entraremos em contato em breve.');
        fetchLeads();
      }
    } catch (error) {
      console.error('❌ Erro ao criar lead Linkae:', error);
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