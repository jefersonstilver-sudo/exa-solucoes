import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ZAPILog {
  id: string;
  agent_key: string;
  direction: 'inbound' | 'outbound';
  phone_number: string;
  message_text: string;
  metadata: any;
  status: 'success' | 'error';
  error_message: string | null;
  created_at: string;
  zapi_message_id: string | null;
  media_url: string | null;
}

export interface ConversationGroup {
  phone_number: string;
  contact_name: string | null;
  agent_key: string;
  agent_name: string;
  last_message: string;
  last_message_at: string;
  total_messages: number;
  unread_count: number;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ZAPILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Buscar conversas da tabela conversations (nova estrutura)
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          contact_phone,
          contact_name,
          agent_key,
          last_message_at,
          created_at,
          provider,
          status
        `)
        .eq('provider', 'zapi')
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Buscar contagem de mensagens não lidas para cada conversa
      const conversationsWithCounts = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Contar total de mensagens
          const { count: totalCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          // Contar mensagens não lidas (inbound)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('direction', 'inbound');

          // Buscar última mensagem
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('body, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            phone_number: conv.contact_phone,
            contact_name: conv.contact_name,
            agent_key: conv.agent_key,
            agent_name: conv.agent_key.replace('_', ' ').toUpperCase(),
            last_message: lastMessage?.body || 'Sem mensagens',
            last_message_at: conv.last_message_at || conv.created_at,
            total_messages: totalCount || 0,
            unread_count: unreadCount || 0,
          };
        })
      );

      // Ordenar por não lidas primeiro, depois por mais recente
      const sortedConversations = conversationsWithCounts.sort((a, b) => {
        // 1. Prioridade: conversas não lidas primeiro
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (b.unread_count > 0 && a.unread_count === 0) return 1;
        
        // 2. Depois por timestamp mais recente
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(sortedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (phoneNumber: string, agentKey: string) => {
    try {
      setMessagesLoading(true);
      
      // Buscar conversa primeiro
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_phone', phoneNumber)
        .eq('agent_key', agentKey)
        .maybeSingle();

      if (!conversation) {
        console.log('No conversation found for:', phoneNumber, agentKey);
        setMessages([]);
        return;
      }

      // Buscar mensagens da conversa
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Converter formato para ZAPILog (compatibilidade)
      const formattedMessages = (data || []).map(msg => ({
        id: msg.id,
        agent_key: msg.agent_key,
        direction: msg.direction as 'inbound' | 'outbound',
        phone_number: phoneNumber,
        message_text: msg.body,
        metadata: msg.raw_payload || {},
        status: 'success' as const,
        error_message: null,
        created_at: msg.created_at,
        zapi_message_id: ((msg.raw_payload as any)?.messageId) || null,
        media_url: null,
      }));

      setMessages(formattedMessages as ZAPILog[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setMessagesLoading(false);
    }
  };

  const selectConversation = async (phoneNumber: string, agentKey: string) => {
    const key = `${phoneNumber}_${agentKey}`;
    setSelectedConversation(key);
    
    await fetchMessages(phoneNumber, agentKey);
    // Refresh conversations para atualizar contadores
    await fetchConversations();
  };

  useEffect(() => {
    fetchConversations();

    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  return {
    conversations,
    messages,
    loading,
    messagesLoading,
    selectedConversation,
    selectConversation,
    refetch: fetchConversations,
  };
};
