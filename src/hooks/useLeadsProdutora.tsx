import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadProdutora {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  tipo_video: string;
  objetivo: string;
  agendar_cafe: boolean;
  contato_realizado: boolean;
  created_at: string;
}

export const useLeadsProdutora = () => {
  const [leads, setLeads] = useState<LeadProdutora[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_leads_produtora_secure');

      if (error) {
        console.error('Erro ao buscar leads Produtora:', error);
        toast.error('Erro ao carregar leads Produtora');
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
      const { data, error } = await supabase.rpc('mark_produtora_lead_contacted_secure', {
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

  const createLead = async (leadData: Omit<LeadProdutora, 'id' | 'created_at' | 'contato_realizado'>) => {
    try {
      console.log('🔄 Criando novo lead Produtora:', leadData);
      
      const { error } = await supabase.rpc('submit_lead_produtora', {
        p_nome: leadData.nome,
        p_email: leadData.email,
        p_whatsapp: leadData.whatsapp,
        p_empresa: leadData.empresa,
        p_tipo_video: leadData.tipo_video,
        p_objetivo: leadData.objetivo,
        p_agendar_cafe: leadData.agendar_cafe
      });

      if (error) {
        console.error('❌ Erro ao criar lead Produtora:', error);
        toast.error('Erro ao enviar formulário: ' + error.message);
        throw error;
      } else {
        toast.success('Formulário enviado com sucesso! Entraremos em contato em breve.');
        fetchLeads();
      }
    } catch (error) {
      console.error('❌ Erro ao criar lead Produtora:', error);
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