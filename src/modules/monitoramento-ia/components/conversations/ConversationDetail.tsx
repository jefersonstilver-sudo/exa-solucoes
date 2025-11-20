import { Phone, MessageCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ZAPILog } from '../../hooks/useConversations';

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-module bg-module-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-module-accent flex items-center justify-center text-white">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-module-primary">{phoneNumber}</h3>
            <p className="text-xs text-module-secondary">
              Agente: {agentKey.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-module-secondary py-8">
            Nenhuma mensagem nesta conversa
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.direction === 'outbound'
                    ? 'bg-module-accent text-white'
                    : 'bg-module-input text-module-primary'
                }`}
              >
                {message.status === 'error' && (
                  <div className="flex items-center gap-2 mb-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs">Erro ao enviar</span>
                  </div>
                )}
                
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.message_text}
                </p>
                
                <div className={`text-xs mt-2 ${
                  message.direction === 'outbound' 
                    ? 'text-white/70' 
                    : 'text-module-tertiary'
                }`}>
                  {format(new Date(message.created_at), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                </div>

                {message.error_message && (
                  <p className="text-xs mt-2 text-red-300">
                    {message.error_message}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
