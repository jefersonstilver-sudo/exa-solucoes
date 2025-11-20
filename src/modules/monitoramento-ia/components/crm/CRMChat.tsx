import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { StickyNote, Tag, MessageSquare } from 'lucide-react';
import { MessageComposer } from './MessageComposer';
import { ConversationNotes } from './ConversationNotes';
import { ConversationTags } from './ConversationTags';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CRMChatProps {
  conversationId: string | null;
  messages: any[];
  loading: boolean;
  onRefresh: () => void;
}

export const CRMChat: React.FC<CRMChatProps> = ({ conversationId, messages, loading, onRefresh }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>Selecione uma conversa para visualizar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-card">
          <h2 className="font-semibold">Conversa</h2>
          <div className="flex gap-2">
            <Button
              variant={showNotes ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
            >
              <StickyNote className="w-4 h-4 mr-2" />
              Notas
            </Button>
            <Button
              variant={showTags ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowTags(!showTags)}
            >
              <Tag className="w-4 h-4 mr-2" />
              Tags
            </Button>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Carregando mensagens...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma mensagem ainda
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex', msg.direction === 'outbound' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-lg p-3',
                    msg.direction === 'outbound'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>

                  {/* Análise de sentimento (apenas inbound) */}
                  {msg.direction === 'inbound' && msg.sentiment && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {msg.sentiment && (
                        <Badge variant="outline" className="text-xs">
                          {msg.sentiment}
                        </Badge>
                      )}
                      {msg.detected_mood > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Humor: {msg.detected_mood}/100
                        </Badge>
                      )}
                      {msg.detected_urgency > 0 && (
                        <Badge variant="outline" className="text-xs text-orange-600">
                          Urgência: {msg.detected_urgency}/10
                        </Badge>
                      )}
                      {msg.intent && (
                        <Badge variant="outline" className="text-xs">
                          {msg.intent}
                        </Badge>
                      )}
                    </div>
                  )}

                  {msg.is_automated && (
                    <Badge variant="outline" className="text-xs mt-2">
                      Automático
                    </Badge>
                  )}

                  <div className="mt-1 text-xs opacity-70">
                    {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <MessageComposer conversationId={conversationId} onMessageSent={onRefresh} />
      </div>

      {/* Sidebar (Notas/Tags) */}
      {(showNotes || showTags) && (
        <div className="w-80 border-l p-4 overflow-y-auto bg-card">
          {showNotes && (
            <div className="mb-6">
              <ConversationNotes conversationId={conversationId} />
            </div>
          )}
          {showTags && (
            <div>
              <ConversationTags conversationId={conversationId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
