import React, { useState } from 'react';
import { WhatsAppCRMInbox } from '../components/crm/WhatsAppCRMInbox';
import { WhatsAppCRMChat } from '../components/crm/WhatsAppCRMChat';
import { CRMFilters } from '../components/crm/CRMFilters';
import { CRMMetrics } from '../components/crm/CRMMetrics';
import { useUnifiedConversations } from '../hooks/useUnifiedConversations';
import { CRMUnificadoMobile } from '../components/crm/mobile/CRMUnificadoMobile';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { startOfDay, endOfDay } from 'date-fns';

export const CRMUnificado = () => {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState({
    agentKey: undefined,
    unreadOnly: false,
    criticalOnly: false,
    hotLeadsOnly: false,
    awaitingOnly: false,
    sentiment: undefined,
    dateFrom: startOfDay(new Date()),
    dateTo: endOfDay(new Date())
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

  // Renderizar versão desktop com tema glassmorphism moderno
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
      {/* Header com métricas e filtros - Glassmorphism */}
      <div className="backdrop-blur-xl bg-white/70 border-b border-gray-200/50 p-4 space-y-4 shadow-sm">
        <CRMMetrics metrics={metrics} />
        <CRMFilters 
          filters={filters} 
          onFilterChange={setFilters} 
          onRefresh={refetch}
        />
      </div>

      {/* Layout de 2 colunas com painéis redimensionáveis */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Painel de conversas (esquerda) */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <div className="h-full flex flex-col backdrop-blur-md bg-white/60 border-r border-gray-200/50">
              <WhatsAppCRMInbox
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={selectConversation}
                loading={loading}
              />
            </div>
          </ResizablePanel>

          {/* Handle redimensionável */}
          <ResizableHandle 
            withHandle 
            className="w-1 bg-gray-200/50 hover:bg-gray-300/70 transition-colors" 
          />

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
