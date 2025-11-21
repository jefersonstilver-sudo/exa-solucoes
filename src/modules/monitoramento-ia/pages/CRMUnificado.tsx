import React, { useState } from 'react';
import { CRMInbox } from '../components/crm/CRMInbox';
import { CRMChat } from '../components/crm/CRMChat';
import { CRMFilters } from '../components/crm/CRMFilters';
import { CRMMetrics } from '../components/crm/CRMMetrics';
import { useUnifiedConversations } from '../hooks/useUnifiedConversations';

export const CRMUnificado = () => {
  const [filters, setFilters] = useState({
    agentKey: undefined,
    unreadOnly: false,
    criticalOnly: false,
    hotLeadsOnly: false,
    awaitingOnly: false,
    sentiment: undefined
  });

  const {
    conversations,
    selectedConversationId,
    messages,
    metrics,
    loading,
    messagesLoading,
    selectConversation,
    refetch
  } = useUnifiedConversations(filters);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header com métricas */}
      <div className="p-4 border-b bg-card">
        <CRMMetrics metrics={metrics} />
      </div>

      {/* Filtros */}
      <div className="p-4 border-b bg-muted/20">
        <CRMFilters filters={filters} onFilterChange={setFilters} onRefresh={refetch} />
      </div>

      {/* Layout principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de conversas (1/3) */}
        <div className="w-1/3 border-r overflow-y-auto bg-card">
          <CRMInbox
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={selectConversation}
            loading={loading}
          />
        </div>

        {/* Chat (2/3) */}
        <div className="w-2/3 bg-background">
          <CRMChat
            conversationId={selectedConversationId}
            messages={messages}
            loading={messagesLoading}
            onRefresh={refetch}
          />
        </div>
      </div>
    </div>
  );
};

export default CRMUnificado;
