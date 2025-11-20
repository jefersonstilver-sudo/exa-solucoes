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
      
      // Buscar logs agrupados por telefone e agente
      const { data: logs, error } = await supabase
        .from('zapi_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar conversas
      const grouped = new Map<string, ConversationGroup>();
      
      logs?.forEach((log: any) => {
        const key = `${log.phone_number}_${log.agent_key}`;
        
        if (!grouped.has(key)) {
          grouped.set(key, {
            phone_number: log.phone_number,
            contact_name: log.metadata?.senderName || null,
            agent_key: log.agent_key,
            agent_name: log.agent_key.replace('_', ' ').toUpperCase(),
            last_message: log.message_text,
            last_message_at: log.created_at,
            total_messages: 1,
            unread_count: log.direction === 'inbound' ? 1 : 0,
          });
        } else {
          const conv = grouped.get(key)!;
          conv.total_messages++;
          if (log.direction === 'inbound' && new Date(log.created_at) > new Date(conv.last_message_at)) {
            conv.unread_count++;
          }
        }
      });

      setConversations(Array.from(grouped.values()).sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      ));
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
      
      const { data, error } = await supabase
        .from('zapi_logs')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('agent_key', agentKey)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data as ZAPILog[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setMessagesLoading(false);
    }
  };

  const selectConversation = (phoneNumber: string, agentKey: string) => {
    const key = `${phoneNumber}_${agentKey}`;
    setSelectedConversation(key);
    fetchMessages(phoneNumber, agentKey);
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
