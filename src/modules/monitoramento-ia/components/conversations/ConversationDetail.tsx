import { Phone, MessageCircle, Bot, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ZAPILog } from '../../hooks/useConversations';
import { MessageBubble } from './MessageBubble';
import { MediaInputBar } from '../crm/MediaInputBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [trainingMode, setTrainingMode] = useState(false);

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

  // Buscar status de modo treinamento
  useEffect(() => {
    if (!phoneNumber || !agentKey) return;

    const checkTrainingMode = async () => {
      const trainingKey = `training_mode_${phoneNumber}`;
      const { data } = await supabase
        .from('agent_context')
        .select('value')
        .eq('key', trainingKey)
        .single();

      const modeValue = data?.value as { active?: boolean } | null;
      setTrainingMode(modeValue?.active || false);
    };

    checkTrainingMode();

    // Atualizar a cada 5 segundos
    const interval = setInterval(checkTrainingMode, 5000);
    return () => clearInterval(interval);
  }, [phoneNumber, agentKey]);

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
      {/* Header - Oculto no mobile (já tem no ConversasCRMEnhanced) */}
      <div className="hidden md:block p-3 md:p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2c33] shadow-sm shrink-0">
        <div className="flex items-center justify-between gap-2 md:gap-3">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate">
                {phoneNumber}
              </h3>
              <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 truncate">
                {agentKey.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
          
          {/* Status e Controle - Versão compacta no mobile */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {trainingMode && (
              <Badge 
                variant="outline" 
                className="border-amber-500 text-amber-600 gap-1 text-[10px] md:text-xs px-1.5 md:px-2 animate-pulse"
              >
                🎓 <span className="hidden md:inline">Modo Treinamento</span>
              </Badge>
            )}
            {aiAutoResponse && (
              <>
                {manualControl ? (
                  <Badge variant="outline" className="border-blue-500 text-blue-600 gap-1 text-[10px] md:text-xs px-1.5 md:px-2">
                    <User className="w-3 h-3 md:w-3 md:h-3" />
                    <span className="hidden md:inline">Controle Manual</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-500 text-green-600 gap-1 text-[10px] md:text-xs px-1.5 md:px-2">
                    <Bot className="w-3 h-3 md:w-3 md:h-3" />
                    <span className="hidden md:inline">IA Ativa</span>
                  </Badge>
                )}
                <Button 
                  size="sm" 
                  variant={manualControl ? "default" : "outline"}
                  onClick={handleToggleControl}
                  className={`text-xs md:text-sm h-7 md:h-8 px-2 md:px-3 ${
                    manualControl ? "bg-blue-500 hover:bg-blue-600" : ""
                  }`}
                >
                  <span className="hidden md:inline">
                    {manualControl ? "Liberar" : "Assumir"}
                  </span>
                  <span className="md:hidden">
                    {manualControl ? "Liberar" : "Assumir"}
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages com scroll otimizado para mobile */}
      <ScrollArea className="flex-1 bg-[#e5ddd5] dark:bg-[#0b141a]">
        <div className="p-3 md:p-4 space-y-2 md:space-y-3 pb-safe">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
              <MessageCircle className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mb-3" />
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Nenhuma mensagem nesta conversa
              </p>
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
              <div ref={messagesEndRef} className="h-2" />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Bar - Fixo no bottom com safe area */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f2c33] pb-safe">
        <MediaInputBar 
          phoneNumber={phoneNumber}
          agentKey={agentKey}
          onMessageSent={() => {
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
};
