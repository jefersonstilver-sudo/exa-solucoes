import React, { useEffect, useRef, useState } from 'react';
import { MobileChatHeader } from './MobileChatHeader';
import { MobileMessageBubble } from './MobileMessageBubble';
import { MediaInputBar } from '../MediaInputBar';
import { LeadDetailModal } from '../LeadDetailModal';
import { MobileChatDetails } from './MobileChatDetails';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface MobileChatViewProps {
  conversationId: string;
  conversation: any;
  messages: any[];
  loading: boolean;
  onBack: () => void;
  onRefresh: () => void;
}

export const MobileChatView: React.FC<MobileChatViewProps> = ({
  conversationId,
  conversation,
  messages,
  loading,
  onBack,
  onRefresh
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<any>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Typing indicator subscription
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

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full bg-module-secondary">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>Selecione uma conversa</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="h-[100dvh] flex flex-col bg-[#e5ddd5] dark:bg-[#0b141a] fixed inset-0 z-50"
    >
      {/* Header */}
      <MobileChatHeader
        conversation={conversation}
        onBack={onBack}
        onDetailsClick={() => setShowDetails(true)}
      />

      {/* Mensagens */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23e5ddd5\'/%3E%3Cpath d=\'M0 0L10 10M10 0L0 10\' stroke=\'%23d1c7b7\' stroke-width=\'0.5\' opacity=\'0.1\'/%3E%3C/svg%3E")',
          backgroundSize: '100px 100px'
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground py-8">
              <div className="animate-spin w-8 h-8 border-4 border-[#25D366] border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm">Carregando mensagens...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
            </div>
          </div>
        ) : (
          <div className="py-4 pb-safe">
            {messages.map((msg, index) => (
              <MobileMessageBubble key={msg.id} message={msg} index={index} />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="px-4 mb-2">
                <div className="bg-white dark:bg-[#1f2c33] rounded-lg rounded-bl-none shadow-sm p-3 max-w-[70px] inline-block">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="pb-safe bg-background border-t border-module-border">
        <MediaInputBar
          phoneNumber={conversation.contact_phone}
          agentKey={conversation.agent_key}
          conversationId={conversationId}
          onMessageSent={onRefresh}
        />
      </div>

      {/* Chat Details */}
      <MobileChatDetails
        conversation={conversation}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onUpdate={onRefresh}
      />
    </motion.div>
  );
};
