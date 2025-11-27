import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  agent_key: string;
  provider: string;
  contact_name: string;
  contact_phone: string;
  contact_type: string | null;
  contact_type_source: 'ai' | 'manual' | 'unknown';
  contact_type_updated_by: string | null;
  last_message_at: string;
  sentiment: string;
  urgency_level: number;
  mood_score: number;
  lead_score: number;
  is_hot_lead: boolean;
  is_critical: boolean;
  is_group: boolean;
  awaiting_response: boolean;
  is_sindico: boolean;
  escalated_to_eduardo: boolean;
  is_muted: boolean;
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
  raw_payload?: any;
  media_url?: string;
  metadata?: any;
}

interface CRMFilters {
  agentKey?: string;
  unreadOnly?: boolean;
  criticalOnly?: boolean;
  hotLeadsOnly?: boolean;
  awaitingOnly?: boolean;
  sentiment?: string;
  contactTypes?: string[]; // Mudou de contactType para contactTypes (array)
}

interface CRMMetrics {
  total: number;
  unread: number;
  critical: number;
  hotLeads: number;
  awaiting: number;
  avgResponseTime: number;
  sofiaMsgToday: number;
  eduardoMsgToday: number;
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
    avgResponseTime: 0,
    sofiaMsgToday: 0,
    eduardoMsgToday: 0
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
      if (filters.contactTypes && filters.contactTypes.length > 0) {
        query = query.in('contact_type', filters.contactTypes);
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

      // Enriquecer conversas com dados do ZAPI (chatName salvo)
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv) => {
          // Buscar última mensagem com chatName do ZAPI
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('raw_payload')
            .eq('conversation_id', conv.id)
            .not('raw_payload', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const rawPayload = lastMsg?.raw_payload as any;
          const zapiChatName = rawPayload?.chatName;
          const currentMetadata = conv.metadata as any;
          
          return {
            ...conv,
            contact_type_source: (conv.contact_type_source || 'unknown') as 'ai' | 'manual' | 'unknown',
            metadata: {
              ...(currentMetadata || {}),
              agent_saved_name: zapiChatName || currentMetadata?.building_name || currentMetadata?.agent_saved_name,
            }
          };
        })
      );

      setConversations(enrichedConversations);

      // Buscar mensagens dos agentes hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: messagesData } = await supabase
        .from('messages')
        .select('agent_key')
        .eq('direction', 'outbound')
        .gte('created_at', today.toISOString());
      
      const sofiaMsgToday = messagesData?.filter(m => m.agent_key === 'sofia').length || 0;
      const eduardoMsgToday = messagesData?.filter(m => m.agent_key === 'eduardo').length || 0;

      // Calcular métricas (excluindo silenciadas das não lidas)
      const newMetrics: CRMMetrics = {
        total: enrichedConversations?.length || 0,
        unread: enrichedConversations?.filter(c => c.awaiting_response && !c.is_muted).length || 0,
        critical: enrichedConversations?.filter(c => c.is_critical).length || 0,
        hotLeads: enrichedConversations?.filter(c => c.is_hot_lead).length || 0,
        awaiting: enrichedConversations?.filter(c => c.awaiting_response && !c.is_muted).length || 0,
        avgResponseTime: 0,
        sofiaMsgToday,
        eduardoMsgToday
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

  const selectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    fetchMessages(conversationId);
    
    console.log('[selectConversation] 📖 Marking conversation as read:', conversationId);
    
    // 🎯 FASE 1: Update otimista - atualizar UI imediatamente
    setConversations(prev => 
      prev.map(c => c.id === conversationId 
        ? { ...c, awaiting_response: false } 
        : c
      )
    );
    
    // Marcar como lida no banco (awaiting_response = false)
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({ awaiting_response: false })
        .eq('id', conversationId)
        .select();
      
      if (error) {
        console.error('[selectConversation] ❌ Error updating awaiting_response:', error);
        // Reverter update otimista em caso de erro
        setConversations(prev => 
          prev.map(c => c.id === conversationId 
            ? { ...c, awaiting_response: true } 
            : c
          )
        );
      } else {
        console.log('[selectConversation] ✅ Conversation marked as read:', data);
      }
    } catch (error) {
      console.error('[selectConversation] ❌ Failed to mark as read:', error);
    }
  };

  // Realtime subscriptions (OTIMIZADO)
  useEffect(() => {
    fetchConversations();

    // Subscription para conversas - Atualiza lista incrementalmente
    const conversationsChannel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          const newConv = payload.new as Conversation;
          setConversations(prev => [{
            ...newConv,
            contact_type_source: (newConv.contact_type_source || 'unknown') as 'ai' | 'manual' | 'unknown'
          }, ...prev]);
          setMetrics(prev => ({ ...prev, total: prev.total + 1 }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          const updatedConv = payload.new as Conversation;
          const typedConv = {
            ...updatedConv,
            contact_type_source: (updatedConv.contact_type_source || 'unknown') as 'ai' | 'manual' | 'unknown'
          };
          
          setConversations(prev => 
            prev.map(c => c.id === typedConv.id ? typedConv : c)
              .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
          );
          
          // Recalcular métricas (mantém contagens de mensagens do dia, excluindo silenciadas)
          setConversations(convs => {
            setMetrics(prev => ({
              ...prev,
              total: convs.length,
              unread: convs.filter(c => c.awaiting_response && !c.is_muted).length,
              critical: convs.filter(c => c.is_critical).length,
              hotLeads: convs.filter(c => c.is_hot_lead).length,
              awaiting: convs.filter(c => c.awaiting_response && !c.is_muted).length
            }));
            return convs;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, [filters]);

  // Subscription separada para mensagens da conversa selecionada
  useEffect(() => {
    if (!selectedConversationId) return;

    const messagesChannel = supabase
      .channel(`messages-${selectedConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Atualizar última mensagem na lista de conversas
          setConversations(prev => prev.map(conv => 
            conv.id === newMessage.conversation_id 
              ? { ...conv, last_message_at: newMessage.created_at }
              : conv
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedConversationId]);

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
