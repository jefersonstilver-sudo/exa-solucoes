import React, { useState } from 'react';
import { WhatsAppCRMInbox } from '../components/crm/WhatsAppCRMInbox';
import { WhatsAppCRMChat } from '../components/crm/WhatsAppCRMChat';
import { CRMFilters } from '../components/crm/CRMFilters';
import { CRMMetrics } from '../components/crm/CRMMetrics';
import { useUnifiedConversations } from '../hooks/useUnifiedConversations';
import { CRMUnificadoMobile } from '../components/crm/mobile/CRMUnificadoMobile';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

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
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Header com métricas e filtros */}
      <div className="p-4 space-y-4">
        <CRMMetrics metrics={metrics} />
        <CRMFilters filters={filters} onFilterChange={setFilters} onRefresh={refetch} />
      </div>

      {/* Layout de 2 colunas com painéis redimensionáveis */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Painel de conversas (esquerda) */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <WhatsAppCRMInbox
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={selectConversation}
              loading={loading}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1 bg-white/30 hover:bg-white/50" />

          {/* Área de chat (direita) */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <WhatsAppCRMChat
              conversationId={selectedConversationId}
              messages={messages}
              loading={messagesLoading}
              onRefresh={refetch}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default CRMUnificado;
