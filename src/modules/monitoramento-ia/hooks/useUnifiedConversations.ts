import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  agent_key: string;
  provider: string;
  contact_name: string;
  contact_phone: string;
  last_message_at: string;
  sentiment: string;
  urgency_level: number;
  mood_score: number;
  lead_score: number;
  is_hot_lead: boolean;
  is_critical: boolean;
  awaiting_response: boolean;
  is_sindico: boolean;
  escalated_to_eduardo: boolean;
  metadata: any;
}

interface Message {
  id: string;
  conversation_id: string;
  agent_key: string;
  provider: string;
  direction: 'inbound' | 'outbound';
  body: string;
  sentiment: string;
  detected_mood: number;
  detected_urgency: number;
  intent: string;
  created_at: string;
  is_automated: boolean;
}

interface CRMFilters {
  agentKey?: string;
  unreadOnly?: boolean;
  criticalOnly?: boolean;
  hotLeadsOnly?: boolean;
  awaitingOnly?: boolean;
  sentiment?: string;
}

interface CRMMetrics {
  total: number;
  unread: number;
  critical: number;
  hotLeads: number;
  awaiting: number;
  avgResponseTime: number;
}

export const useUnifiedConversations = (filters: CRMFilters) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<CRMMetrics>({
    total: 0,
    unread: 0,
    critical: 0,
    hotLeads: 0,
    awaiting: 0,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const { toast } = useToast();

  const fetchConversations = async () => {
    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      // Aplicar filtros
      if (filters.agentKey) {
        query = query.eq('agent_key', filters.agentKey);
      }
      if (filters.unreadOnly) {
        query = query.eq('awaiting_response', true);
      }
      if (filters.criticalOnly) {
        query = query.eq('is_critical', true);
      }
      if (filters.hotLeadsOnly) {
        query = query.eq('is_hot_lead', true);
      }
      if (filters.awaitingOnly) {
        query = query.eq('awaiting_response', true);
      }
      if (filters.sentiment) {
        query = query.eq('sentiment', filters.sentiment);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: 'Erro ao carregar conversas',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      setConversations(data || []);

      // Calcular métricas
      const newMetrics: CRMMetrics = {
        total: data?.length || 0,
        unread: data?.filter(c => c.awaiting_response).length || 0,
        critical: data?.filter(c => c.is_critical).length || 0,
        hotLeads: data?.filter(c => c.is_hot_lead).length || 0,
        awaiting: data?.filter(c => c.awaiting_response).length || 0,
        avgResponseTime: 0 // TODO: calcular baseado em avg_response_time
      };

      setMetrics(newMetrics);
      setLoading(false);
    } catch (error: any) {
      console.error('Error in fetchConversations:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar conversas',
        variant: 'destructive'
      });
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Erro ao carregar mensagens',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      setMessages((data || []) as Message[]);
    } catch (error: any) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const selectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    fetchMessages(conversationId);
  };

  // Realtime subscriptions
  useEffect(() => {
    fetchConversations();

    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: selectedConversationId ? `conversation_id=eq.${selectedConversationId}` : undefined
        },
        () => {
          if (selectedConversationId) {
            fetchMessages(selectedConversationId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [filters, selectedConversationId]);

  return {
    conversations,
    selectedConversationId,
    messages,
    metrics,
    loading,
    messagesLoading,
    selectConversation,
    refetch: fetchConversations
  };
};
