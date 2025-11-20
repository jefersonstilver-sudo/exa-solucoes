import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ZAPILog } from '../../types/crmTypes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';
import { ConversationNotes } from './ConversationNotes';
import { ConversationTags } from './ConversationTags';
import { MessageComposer } from './MessageComposer';

interface ConversationDetailProps {
  phoneNumber: string;
  agentKey: string;
  messages: ZAPILog[];
  loading: boolean;
  onRefresh: () => void;
}

export const ConversationDetail: React.FC<ConversationDetailProps> = ({
  phoneNumber,
  agentKey,
  messages,
  loading,
  onRefresh
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!phoneNumber) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">Selecione uma conversa</p>
          <p className="text-sm">Escolha uma conversa na lista à esquerda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{phoneNumber}</h3>
              <p className="text-sm text-muted-foreground">
                {messages.length} mensagens
              </p>
            </div>
            <Badge variant="secondary">
              {agentKey.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Carregando mensagens...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const isOutbound = msg.direction === 'outbound';
                const showDate = idx === 0 || 
                  format(new Date(msg.created_at), 'dd/MM/yyyy') !== 
                  format(new Date(messages[idx - 1].created_at), 'dd/MM/yyyy');

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                          {format(new Date(msg.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          isOutbound
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.message_text}
                        </p>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <span className={`text-xs ${isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </span>
                          {isOutbound && (
                            msg.status === 'sent' || msg.status === 'delivered' ? (
                              <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                            ) : (
                              <Check className="w-3 h-3 text-primary-foreground/70" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Composer */}
        <MessageComposer 
          phoneNumber={phoneNumber}
          agentKey={agentKey}
          onMessageSent={onRefresh}
        />
      </div>

      {/* Side Panel */}
      <div className="w-80 border-l bg-card p-4 overflow-y-auto">
        <ConversationTags phoneNumber={phoneNumber} agentKey={agentKey} />
        <div className="my-6 border-t" />
        <ConversationNotes phoneNumber={phoneNumber} agentKey={agentKey} />
      </div>
    </div>
  );
};
