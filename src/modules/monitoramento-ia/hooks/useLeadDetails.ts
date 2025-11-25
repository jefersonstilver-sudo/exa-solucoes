import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LeadDetails, LeadMetrics } from '../types/crmTypes';

export const useLeadDetails = (conversationId: string | null) => {
  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [metrics, setMetrics] = useState<LeadMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLeadDetails = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    try {
      // Buscar dados da conversa
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Buscar contagem de mensagens
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      // Calcular métricas
      const firstContactFormatted = conv.first_message_at 
        ? new Date(conv.first_message_at).toLocaleDateString('pt-BR')
        : 'N/A';
      
      const lastContactFormatted = conv.last_message_at
        ? new Date(conv.last_message_at).toLocaleDateString('pt-BR')
        : 'N/A';

      const daysSinceLastContact = conv.last_message_at
        ? Math.floor((Date.now() - new Date(conv.last_message_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const avgResponseTimeFormatted = (conv.avg_response_time as string) || 'N/A';

      const leadData: LeadDetails = {
        id: conv.id,
        contact_name: conv.contact_name,
        contact_phone: conv.contact_phone,
        contact_type: conv.contact_type,
        contact_type_source: (conv.contact_type_source || 'unknown') as 'ai' | 'manual' | 'unknown',
        contact_type_updated_by: conv.contact_type_updated_by,
        contact_type_updated_at: conv.contact_type_updated_at,
        agent_key: conv.agent_key,
        is_sindico: conv.is_sindico || false,
        is_hot_lead: conv.is_hot_lead || false,
        is_critical: conv.is_critical || false,
        lead_score: conv.lead_score,
        mood_score: conv.mood_score,
        urgency_level: conv.urgency_level,
        sentiment: conv.sentiment,
        first_message_at: conv.first_message_at,
        last_message_at: conv.last_message_at,
        avg_response_time: avgResponseTimeFormatted,
        awaiting_response: conv.awaiting_response || false,
        escalated_to_eduardo: conv.escalated_to_eduardo || false,
        escalated_at: conv.escalated_at
      };

      setLead(leadData);
      setMetrics({
        totalMessages: messageCount || 0,
        avgResponseTimeFormatted,
        firstContactFormatted,
        lastContactFormatted,
        daysSinceLastContact
      });
    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast.error('Erro ao carregar detalhes do lead');
    } finally {
      setLoading(false);
    }
  };

  const updateLeadType = async (contactType: string) => {
    if (!conversationId) {
      console.error('No conversationId provided');
      return;
    }

    console.log('Updating lead type to:', contactType, 'for conversation:', conversationId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData = { 
        contact_type: contactType,
        contact_type_source: 'manual' as const,
        contact_type_updated_by: user?.id || null,
        contact_type_updated_at: new Date().toISOString()
      };

      console.log('Update data:', updateData);
      
      const { data, error } = await supabase
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful, returned data:', data);
      
      toast.success('Tipo de contato atualizado manualmente');
      await fetchLeadDetails();
    } catch (error) {
      console.error('Error updating lead type:', error);
      toast.error('Erro ao atualizar tipo de contato');
    }
  };

  const generateReport = async () => {
    if (!conversationId) return null;

    try {
      toast.info('Gerando relatório com IA...');
      
      const { data, error } = await supabase.functions.invoke('generate-conversation-report', {
        body: { conversationId }
      });

      if (error) throw error;
      
      toast.success('Relatório gerado com sucesso!');
      return data;
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Erro ao gerar relatório');
      return null;
    }
  };

  const updateLeadScore = async (score: number) => {
    if (!conversationId) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ lead_score: score })
        .eq('id', conversationId);

      if (error) throw error;
      toast.success('Lead score atualizado');
      await fetchLeadDetails();
    } catch (error) {
      console.error('Error updating lead score:', error);
      toast.error('Erro ao atualizar lead score');
    }
  };

  const toggleSindico = async () => {
    if (!conversationId || !lead) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_sindico: !lead.is_sindico })
        .eq('id', conversationId);

      if (error) throw error;
      toast.success(lead.is_sindico ? 'Removido como síndico' : 'Marcado como síndico');
      await fetchLeadDetails();
    } catch (error) {
      console.error('Error toggling sindico:', error);
      toast.error('Erro ao atualizar status de síndico');
    }
  };

  const toggleHotLead = async () => {
    if (!conversationId || !lead) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_hot_lead: !lead.is_hot_lead })
        .eq('id', conversationId);

      if (error) throw error;
      toast.success(lead.is_hot_lead ? 'Removido de hot lead' : 'Marcado como hot lead');
      await fetchLeadDetails();
    } catch (error) {
      console.error('Error toggling hot lead:', error);
      toast.error('Erro ao atualizar hot lead');
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [conversationId]);

  return {
    lead,
    metrics,
    loading,
    updateLeadType,
    updateLeadScore,
    toggleSindico,
    toggleHotLead,
    generateReport,
    refetch: fetchLeadDetails
  };
};