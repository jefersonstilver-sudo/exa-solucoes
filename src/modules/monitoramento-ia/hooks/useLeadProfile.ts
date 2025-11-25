import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadProfile {
  id: string;
  conversation_id: string;
  // Anunciante
  empresa_nome?: string | null;
  segmento?: string | null;
  bairro_interesse?: string | null;
  predios_desejados?: number | null;
  intencao?: 'baixa' | 'media' | 'alta' | null;
  orcamento_estimado?: number | null;
  estagio_compra?: 'consultando' | 'orcamento' | 'decidindo' | 'comprando' | null;
  // Síndico
  predio_nome?: string | null;
  predio_andares?: number | null;
  predio_unidades?: number | null;
  predio_tipo?: 'residencial' | 'comercial' | 'misto' | null;
  administradora?: string | null;
  interesse_real?: boolean | null;
  // Comum
  probabilidade_fechamento?: number | null;
  urgencia?: 'baixa' | 'media' | 'alta' | 'critica' | null;
  necessita_escalacao?: boolean;
  motivo_escalacao?: string | null;
  is_hot_lead?: boolean;
  hot_lead_score?: number;
  proximos_passos?: any;
  objecoes_identificadas?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export const useLeadProfile = (conversationId: string | null) => {
  const [profile, setProfile] = useState<LeadProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_profiles')
        .select('*')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data as LeadProfile | null);
    } catch (error) {
      console.error('Error fetching lead profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<LeadProfile>) => {
    if (!conversationId) return;

    try {
      const { error } = await supabase
        .from('lead_profiles')
        .upsert([{
          conversation_id: conversationId,
          ...updates,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'conversation_id'
        });

      if (error) throw error;
      
      toast.success('Perfil do lead atualizado');
      await fetchProfile();
    } catch (error) {
      console.error('Error updating lead profile:', error);
      toast.error('Erro ao atualizar perfil do lead');
    }
  };

  const saveFromReport = async (reportData: any) => {
    if (!conversationId || !reportData) return;

    try {
      const profileData = {
        conversation_id: conversationId,
        // Extrair dados do relatório
        empresa_nome: reportData.leadProfile?.empresaNome || null,
        segmento: reportData.leadProfile?.segmento || null,
        bairro_interesse: reportData.leadProfile?.bairroInteresse || null,
        predios_desejados: reportData.leadProfile?.prediosDesejados || null,
        intencao: reportData.leadProfile?.intencao || null,
        orcamento_estimado: reportData.leadProfile?.orcamentoEstimado || null,
        estagio_compra: reportData.leadProfile?.estagioCompra || null,
        predio_nome: reportData.leadProfile?.predioNome || null,
        predio_andares: reportData.leadProfile?.predioAndares || null,
        predio_unidades: reportData.leadProfile?.predioUnidades || null,
        predio_tipo: reportData.leadProfile?.predioTipo || null,
        administradora: reportData.leadProfile?.administradora || null,
        interesse_real: reportData.leadProfile?.interesseReal ?? null,
        probabilidade_fechamento: reportData.probabilidadeFechamento || null,
        urgencia: reportData.urgencia || null,
        necessita_escalacao: reportData.necessitaEscalacao || false,
        motivo_escalacao: reportData.motivoEscalacao || null,
        is_hot_lead: reportData.isHotLead || false,
        hot_lead_score: reportData.hotLeadScore || 0,
        proximos_passos: reportData.proximosPassos || null,
        objecoes_identificadas: reportData.objecoesIdentificadas || null
      };

      const { error } = await supabase
        .from('lead_profiles')
        .upsert([profileData], {
          onConflict: 'conversation_id'
        });

      if (error) throw error;
      
      await fetchProfile();
    } catch (error) {
      console.error('Error saving lead profile from report:', error);
      toast.error('Erro ao salvar perfil do lead');
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [conversationId]);

  return {
    profile,
    loading,
    updateProfile,
    saveFromReport,
    refetch: fetchProfile
  };
};
