import React, { useState, useRef } from 'react';
import { WhatsAppCRMInbox } from '../components/crm/WhatsAppCRMInbox';
import { WhatsAppCRMChat } from '../components/crm/WhatsAppCRMChat';
import { CRMFilters } from '../components/crm/CRMFilters';
import { CRMMetrics } from '../components/crm/CRMMetrics';
import { useUnifiedConversations } from '../hooks/useUnifiedConversations';
import { CRMUnificadoMobile } from '../components/crm/mobile/CRMUnificadoMobile';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { PanelLeftOpen, PanelRightOpen, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CRMUnificado = () => {
  const isMobile = useIsMobile();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [filters, setFilters] = useState({
    agentKey: undefined,
    unreadOnly: false,
    criticalOnly: false,
    hotLeadsOnly: false,
    awaitingOnly: false,
    sentiment: undefined
  });

  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const handleLeftRestore = () => {
    leftPanelRef.current?.resize(30);
    setLeftPanelCollapsed(false);
  };

  const handleRightRestore = () => {
    rightPanelRef.current?.resize(70);
    setRightPanelCollapsed(false);
  };

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

  // Renderizar versão desktop
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800 overflow-hidden">
      {/* Header com métricas e filtros - Esconde em fullscreen */}
      {!isFullscreen && (
        <div className="p-4 space-y-3">
          {/* Toggle minimalista para métricas */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
              className="text-muted-foreground hover:text-foreground h-8 px-2"
            >
              {showMetrics ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  <span className="text-xs">Ocultar Métricas</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  <span className="text-xs">Mostrar Métricas</span>
                </>
              )}
            </Button>
          </div>

          {/* Métricas colapsáveis */}
          {showMetrics && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <CRMMetrics metrics={metrics} />
            </div>
          )}
          
          {/* Filtros sempre visíveis mas minimalistas */}
          <CRMFilters filters={filters} onFilterChange={setFilters} onRefresh={refetch} />
        </div>
      )}

      {/* Layout de 2 colunas com painéis redimensionáveis */}
      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal">
          {/* Painel de conversas (esquerda) */}
          <ResizablePanel 
            ref={leftPanelRef}
            defaultSize={30} 
            minSize={5}
            maxSize={50}
            onResize={(size) => {
              setLeftPanelCollapsed(size < 10);
            }}
          >
            <WhatsAppCRMInbox
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={selectConversation}
              loading={loading}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="w-1 bg-white/30 hover:bg-white/50" />

          {/* Área de chat (direita) */}
          <ResizablePanel 
            ref={rightPanelRef}
            defaultSize={70} 
            minSize={50}
            onResize={(size) => {
              setRightPanelCollapsed(size < 10);
            }}
          >
            <WhatsAppCRMChat
              conversationId={selectedConversationId}
              messages={messages}
              loading={messagesLoading}
              onRefresh={refetch}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Botão glass para restaurar painel esquerdo */}
        {leftPanelCollapsed && (
          <button
            onClick={handleLeftRestore}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50 group"
            aria-label="Restaurar sidebar de conversas"
          >
            <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-4 shadow-2xl hover:bg-white/30 hover:scale-110 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
              <PanelLeftOpen className="h-6 w-6 text-primary drop-shadow-lg" />
            </div>
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="backdrop-blur-xl bg-white/90 border border-white/30 rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap text-sm font-medium text-primary">
                Mostrar conversas
              </div>
            </div>
          </button>
        )}

        {/* Botão glass para restaurar painel direito */}
        {rightPanelCollapsed && (
          <button
            onClick={handleRightRestore}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 group"
            aria-label="Restaurar área de chat"
          >
            <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-2xl p-4 shadow-2xl hover:bg-white/30 hover:scale-110 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
              <PanelRightOpen className="h-6 w-6 text-primary drop-shadow-lg" />
            </div>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="backdrop-blur-xl bg-white/90 border border-white/30 rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap text-sm font-medium text-primary">
                Mostrar chat
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default CRMUnificado;
