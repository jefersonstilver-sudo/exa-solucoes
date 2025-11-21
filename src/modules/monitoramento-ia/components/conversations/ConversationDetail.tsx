import { Phone, MessageCircle, Bot, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ZAPILog } from '../../hooks/useConversations';
import { MessageBubble } from './MessageBubble';
import { MediaInputBar } from '../crm/MediaInputBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConversationDetailProps {
  messages: ZAPILog[];
  loading: boolean;
  phoneNumber: string | null;
  agentKey: string | null;
}

export const ConversationDetail = ({ 
  messages, 
  loading, 
  phoneNumber,
  agentKey 
}: ConversationDetailProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [manualControl, setManualControl] = useState(false);
  const [aiAutoResponse, setAiAutoResponse] = useState<boolean | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Buscar status de AI auto response do agente
  useEffect(() => {
    const fetchAgentStatus = async () => {
      if (!agentKey) return;
      
      const { data, error } = await supabase
        .from('agents')
        .select('ai_auto_response')
        .eq('key', agentKey)
        .single();

      if (data && !error) {
        setAiAutoResponse(data.ai_auto_response);
      }
    };

    fetchAgentStatus();
  }, [agentKey]);

  const handleToggleControl = async () => {
    if (!phoneNumber || !agentKey) return;
    
    const newManualControl = !manualControl;
    setManualControl(newManualControl);

    // Atualizar na conversa que está em controle manual
    const conversationId = `${phoneNumber}_${agentKey}`;
    const { error } = await supabase
      .from('conversations')
      .update({ metadata: { manual_control: newManualControl } })
      .eq('id', conversationId);

    if (error) {
      console.error('Erro ao atualizar controle:', error);
      toast.error('Erro ao atualizar controle da conversa');
    } else {
      toast.success(newManualControl ? 'Controle manual ativado - IA pausada' : 'Controle automático restaurado');
    }
  };

  if (!phoneNumber || !agentKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-16 h-16 text-module-tertiary mb-4" />
        <h3 className="text-lg font-semibold text-module-primary mb-2">
          Selecione uma conversa
        </h3>
        <p className="text-sm text-module-secondary max-w-sm">
          Escolha uma conversa na lista ao lado para visualizar as mensagens.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-module-secondary">Carregando mensagens...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#e5ddd5] dark:bg-[#0b141a]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2c33] shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <Phone className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{phoneNumber}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {agentKey.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          
          {/* Status e Controle */}
          <div className="flex items-center gap-2">
            {aiAutoResponse && (
              <>
                {manualControl ? (
                  <Badge variant="outline" className="border-blue-500 text-blue-600 gap-1">
                    <User className="w-3 h-3" />
                    Controle Manual
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
                    <Bot className="w-3 h-3" />
                    IA Ativa
                  </Badge>
                )}
                <Button 
                  size="sm" 
                  variant={manualControl ? "default" : "outline"}
                  onClick={handleToggleControl}
                  className={manualControl ? "bg-blue-500 hover:bg-blue-600" : ""}
                >
                  {manualControl ? "Liberar Controle" : "Assumir Controle"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[#e5ddd5] dark:bg-[#0b141a]">
        {messages.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            Nenhuma mensagem nesta conversa
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                direction={message.direction}
                messageText={message.message_text}
                mediaUrl={message.media_url}
                mediaType={message.metadata?.media_type}
                status={message.status}
                errorMessage={message.error_message}
                createdAt={message.created_at}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <MediaInputBar 
        phoneNumber={phoneNumber}
        agentKey={agentKey}
        onMessageSent={() => {
          // Recarregar página após envio para mostrar nova mensagem
          window.location.reload();
        }}
      />
    </div>
  );
};
