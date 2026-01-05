import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Bot, User, ExternalLink, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { Contact } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface TabConversasProps {
  contact: Contact;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface Conversation {
  id: string;
  agent_key: string;
  created_at: string;
  status: string;
}

export const TabConversas: React.FC<TabConversasProps> = ({ contact }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [contact.telefone]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const phone = contact.telefone.replace(/\D/g, '');
      
      // Buscar conversas pelo telefone (coluna correta: contact_phone)
      const { data, error } = await supabase
        .from('conversations')
        .select('id, agent_key, created_at, status')
        .or(`contact_phone.eq.${phone},contact_phone.eq.55${phone},contact_phone.ilike.%${phone}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setConversations(data || []);
      
      if (data && data.length > 0) {
        setSelectedConversation(data[0].id);
        fetchMessages(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, body, from_role, direction, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      // Map 'body' to 'content' and 'from_role' to 'role' for our interface
      const mappedMessages = (data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.body || '',
        role: msg.from_role === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
        created_at: msg.created_at
      }));
      setMessages(mappedMessages);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const syncConversation = async (conversationId: string) => {
    try {
      setSyncing(true);
      const { data, error } = await supabase.functions.invoke('sync-single-conversation', {
        body: { conversationId }
      });
      
      if (error) throw error;
      
      // Recarregar mensagens após sync
      await fetchMessages(conversationId);
      
      const messagesCount = data?.stats?.messages_synced || data?.messagesCount || 0;
      toast.success(`Sincronização concluída! ${messagesCount} mensagens encontradas.`);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar mensagens do WhatsApp');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-8">
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-12 text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-foreground">Nenhuma conversa encontrada</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Não há conversas registradas com o telefone {contact.telefone}
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              const phone = contact.telefone.replace(/\D/g, '');
              window.open(`https://wa.me/55${phone}`, '_blank');
            }}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Iniciar conversa no WhatsApp
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de Conversas */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Conversas ({conversations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {conversations.map((conv) => (
              <Button
                key={conv.id}
                variant={selectedConversation === conv.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedConversation(conv.id);
                  fetchMessages(conv.id);
                }}
                className="text-xs"
              >
                {conv.agent_key === 'sofia' ? (
                  <Bot className="w-3 h-3 mr-1" />
                ) : (
                  <User className="w-3 h-3 mr-1" />
                )}
                {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true, locale: ptBR })}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mensagens */}
      {selectedConversation && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Mensagens
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => syncConversation(selectedConversation)}
                disabled={syncing}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => {
                  const conv = conversations.find(c => c.id === selectedConversation);
                  if (conv) {
                    const agentRoute = conv.agent_key === 'sofia' ? 'sofia' : 'eduardo';
                    window.open(`/super_admin/conversas/whatsapp/${agentRoute}/${selectedConversation}`, '_blank');
                  }
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Abrir no CRM
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Nenhuma mensagem encontrada nesta conversa.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => syncConversation(selectedConversation)}
                  disabled={syncing}
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sincronizar do WhatsApp
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Clique para buscar as mensagens diretamente do WhatsApp
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-green-100 text-green-900'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TabConversas;
