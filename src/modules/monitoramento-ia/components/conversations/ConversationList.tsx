import { MessageCircle, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ConversationGroup } from '../../hooks/useConversations';

interface ConversationListProps {
  conversations: ConversationGroup[];
  selectedConversation: string | null;
  onSelect: (phoneNumber: string, agentKey: string) => void;
  loading: boolean;
}

export const ConversationList = ({ 
  conversations, 
  selectedConversation, 
  onSelect,
  loading 
}: ConversationListProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-module-secondary">Carregando conversas...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <MessageCircle className="w-16 h-16 text-module-tertiary mb-4" />
        <h3 className="text-lg font-semibold text-module-primary mb-2">
          Nenhuma conversa ainda
        </h3>
        <p className="text-sm text-module-secondary max-w-sm">
          As conversas dos seus agentes aparecerão aqui assim que receberem mensagens via Z-API.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {conversations.map((conv) => {
        const key = `${conv.phone_number}_${conv.agent_key}`;
        const isSelected = selectedConversation === key;
        
        return (
          <button
            key={key}
            onClick={() => onSelect(conv.phone_number, conv.agent_key)}
            className={`w-full p-4 border-b border-module transition-colors text-left ${
              isSelected 
                ? 'bg-module-accent/10 border-l-4 border-l-module-accent' 
                : 'hover:bg-module-hover'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar colorido por agente */}
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  conv.agent_key === 'sofia' ? 'bg-purple-500 text-white' :
                  conv.agent_key === 'iris' ? 'bg-blue-500 text-white' :
                  conv.agent_key === 'eduardo' ? 'bg-green-500 text-white' :
                  conv.agent_key === 'exa_alert' ? 'bg-orange-500 text-white' :
                  'bg-gray-500 text-white'
                }`}
              >
                {conv.agent_key === 'sofia' ? '🟣' :
                 conv.agent_key === 'iris' ? '💼' :
                 conv.agent_key === 'eduardo' ? '👨‍💼' :
                 conv.agent_key === 'exa_alert' ? '🔔' :
                 '🤖'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-module-primary truncate">
                    {conv.contact_name || conv.phone_number}
                  </h3>
                  <span className="text-xs text-module-tertiary ml-2">
                    {formatDistanceToNow(new Date(conv.last_message_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
                
                <p className="text-sm text-module-secondary truncate mb-1">
                  {conv.last_message}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-module-tertiary">
                    🤖 {conv.agent_name}
                  </span>
                  
                  {conv.unread_count > 0 && (
                    <span className="bg-module-accent text-white text-xs px-2 py-0.5 rounded-full">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
