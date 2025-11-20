import { useConversations } from '../hooks/useConversations';
import { ConversationList } from '../components/conversations/ConversationList';
import { ConversationDetail } from '../components/conversations/ConversationDetail';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ConversasCRM = () => {
  const {
    conversations,
    messages,
    loading,
    messagesLoading,
    selectedConversation,
    selectConversation,
    refetch,
  } = useConversations();

  const getSelectedPhone = () => {
    if (!selectedConversation) return null;
    return selectedConversation.split('_')[0];
  };

  const getSelectedAgent = () => {
    if (!selectedConversation) return null;
    return selectedConversation.split('_').slice(1).join('_');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-[14px] border border-module p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2">
              💬 Conversas Z-API
            </h1>
            <p className="text-module-secondary">
              Acompanhe todas as conversas dos seus agentes via WhatsApp
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* CRM Interface */}
      <div className="bg-module-card rounded-[14px] border border-module overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-280px)]">
          {/* Lista de Conversas */}
          <div className="lg:col-span-1 border-r border-module">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelect={selectConversation}
              loading={loading}
            />
          </div>

          {/* Detalhes da Conversa */}
          <div className="lg:col-span-2">
            <ConversationDetail
              messages={messages}
              loading={messagesLoading}
              phoneNumber={getSelectedPhone()}
              agentKey={getSelectedAgent()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
