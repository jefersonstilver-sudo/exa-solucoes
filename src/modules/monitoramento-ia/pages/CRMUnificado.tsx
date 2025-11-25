import React, { useState } from 'react';
import { WhatsAppCRMInbox } from '../components/crm/WhatsAppCRMInbox';
import { WhatsAppCRMChat } from '../components/crm/WhatsAppCRMChat';
import { CRMFilters } from '../components/crm/CRMFilters';
import { CRMMetrics } from '../components/crm/CRMMetrics';
import { useUnifiedConversations } from '../hooks/useUnifiedConversations';
import { CRMUnificadoMobile } from '../components/crm/mobile/CRMUnificadoMobile';
import { useIsMobile } from '@/hooks/use-mobile';

export const CRMUnificado = () => {
  const isMobile = useIsMobile();
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

  // Renderizar versão mobile
  if (isMobile) {
    return <CRMUnificadoMobile initialFilters={filters} />;
  }

  // Renderizar versão desktop com tema WhatsApp
  return (
    <div className="h-screen flex flex-col bg-whatsapp-bg-main overflow-hidden">
      {/* Header com métricas e filtros */}
      <div className="bg-whatsapp-panel-bg border-b border-whatsapp-border p-4 space-y-4">
        <CRMMetrics metrics={metrics} />
        <CRMFilters filters={filters} onFilterChange={setFilters} onRefresh={refetch} />
      </div>

      {/* Layout de 2 colunas estilo WhatsApp */}
      <div className="flex-1 flex overflow-hidden">
        {/* Painel de conversas (esquerda) */}
        <div className="w-[400px] border-r border-whatsapp-border flex flex-col bg-whatsapp-panel-bg">
          <WhatsAppCRMInbox
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={selectConversation}
            loading={loading}
          />
        </div>

        {/* Área de chat (direita) */}
        <div className="flex-1">
          <WhatsAppCRMChat
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
