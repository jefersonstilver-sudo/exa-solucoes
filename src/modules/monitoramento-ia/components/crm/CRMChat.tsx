import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { StickyNote, Tag, MessageSquare } from 'lucide-react';
import { MediaInputBar } from './MediaInputBar';
import { ConversationNotes } from './ConversationNotes';
import { ConversationTags } from './ConversationTags';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface CRMChatProps {
  conversationId: string | null;
  messages: any[];
  loading: boolean;
  onRefresh: () => void;
}

export const CRMChat: React.FC<CRMChatProps> = ({ conversationId, messages, loading, onRefresh }) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<any>(null);

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId]);

  const fetchConversation = async () => {
    if (!conversationId) return;
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (!error && data) {
      setConversation(data);
    }
  };

  // Subscription para typing indicator
  useEffect(() => {
    if (!conversationId) return;

    typingChannelRef.current = supabase
      .channel(`typing:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannelRef.current?.presenceState();
        const presence = Object.values(state || {}).flat();
        const someoneTyping = presence.some((p: any) => p.typing === true);
        setIsTyping(someoneTyping);
      })
      .subscribe();

    return () => {
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
      }
    };
  }, [conversationId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
    
    // Scroll quando keyboard aparece (mobile)
    const handleResize = () => {
      if (window.visualViewport) {
        scrollToBottom();
      }
    };
    
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, [messages, isTyping]);

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground bg-[#e5ddd5] dark:bg-[#0b141a]">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>Selecione uma conversa para visualizar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full max-h-[100dvh]">
      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col">
        {/* Header - Desktop only */}
        <div className="hidden md:flex p-4 border-b items-center justify-between bg-card shrink-0">
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

        {/* Mensagens - Scroll nativo */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 bg-[#e5ddd5] dark:bg-[#0b141a]" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-[#25D366] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#667781]">Carregando mensagens...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma mensagem ainda
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex animate-in fade-in slide-in-from-bottom-2 duration-200',
                  msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'relative max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 shadow-sm',
                    msg.direction === 'outbound'
                      ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef]'
                      : 'bg-white dark:bg-[#1f2c33] text-[#111b21] dark:text-[#e9edef]'
                  )}
                >
                  <p className="text-xs md:text-sm whitespace-pre-wrap">{msg.body}</p>

                  {/* Análise de sentimento (apenas inbound) */}
                  {msg.direction === 'inbound' && (msg.sentiment || msg.detected_mood || msg.detected_urgency || msg.intent) && (
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {msg.sentiment && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {msg.sentiment}
                        </Badge>
                      )}
                      {msg.detected_mood > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          Humor: {msg.detected_mood}/100
                        </Badge>
                      )}
                      {msg.detected_urgency > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-orange-600">
                          Urgência: {msg.detected_urgency}/10
                        </Badge>
                      )}
                      {msg.intent && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {msg.intent}
                        </Badge>
                      )}
                    </div>
                  )}

                  {msg.is_automated && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 mt-1">
                      Automático
                    </Badge>
                  )}

                  <div className="flex items-center gap-1 mt-1 justify-end">
                    <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">
                      {format(new Date(msg.created_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="bg-white dark:bg-[#1f2c33] rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#667781] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#667781] rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-[#667781] rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
                <span className="text-sm text-[#667781]">Digitando...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Composer - Sticky bottom */}
        {conversation && (
          <div className="sticky bottom-0 z-10 border-t bg-white pb-safe shadow-lg shrink-0">
            <MediaInputBar 
              phoneNumber={conversation.contact_phone} 
              agentKey={conversation.agent_key}
              conversationId={conversationId!}
              onMessageSent={onRefresh} 
            />
          </div>
        )}
      </div>

      {/* Sidebar (Notas/Tags) - Desktop only */}
      {(showNotes || showTags) && conversation && (
        <div className="hidden md:block w-80 border-l p-4 overflow-y-auto bg-card">
          {showNotes && (
            <div className="mb-6">
              <ConversationNotes 
                phoneNumber={conversation.contact_phone} 
                agentKey={conversation.agent_key} 
              />
            </div>
          )}
          {showTags && (
            <div>
              <ConversationTags 
                phoneNumber={conversation.contact_phone} 
                agentKey={conversation.agent_key} 
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
