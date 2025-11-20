import { Phone, MessageCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ZAPILog } from '../../hooks/useConversations';
import { MessageBubble } from './MessageBubble';

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    </div>
  );
};
