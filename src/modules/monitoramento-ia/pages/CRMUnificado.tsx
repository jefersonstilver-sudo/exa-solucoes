import React, { useState } from 'react';
import { CRMInbox } from '../components/crm/CRMInbox';
import { CRMChat } from '../components/crm/CRMChat';
import { CRMFilters } from '../components/crm/CRMFilters';
import { CRMMetrics } from '../components/crm/CRMMetrics';
import { useUnifiedConversations } from '../hooks/useUnifiedConversations';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone } from 'lucide-react';

export const CRMUnificado = () => {
  const [filters, setFilters] = useState({
    agentKey: undefined,
    unreadOnly: false,
    criticalOnly: false,
    hotLeadsOnly: false,
    awaitingOnly: false,
    sentiment: undefined
  });

  const [showMobileChat, setShowMobileChat] = useState(false);

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

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header com métricas - Oculto no mobile quando chat aberto */}
      <div className={`${showMobileChat ? 'hidden md:block' : 'block'} p-4 border-b bg-card shrink-0`}>
        <CRMMetrics metrics={metrics} />
      </div>

      {/* Filtros - Oculto no mobile quando chat aberto */}
      <div className={`${showMobileChat ? 'hidden md:block' : 'block'} p-4 border-b bg-muted/20 shrink-0`}>
        <CRMFilters filters={filters} onFilterChange={setFilters} onRefresh={refetch} />
      </div>

      {/* Layout Desktop */}
      <div className="hidden md:flex flex-1 overflow-hidden">
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

      {/* Layout Mobile - Alternado com CSS */}
      <div className="flex md:hidden flex-1 overflow-hidden relative">
        {/* Lista de conversas */}
        <div 
          className={`absolute inset-0 bg-background transition-transform duration-200 ${
            showMobileChat ? '-translate-x-full' : 'translate-x-0'
          }`}
        >
          <CRMInbox
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={handleSelectConversation}
            loading={loading}
          />
        </div>

        {/* Chat */}
        <div 
          className={`absolute inset-0 bg-background flex flex-col transition-transform duration-200 ${
            showMobileChat ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header mobile minimalista - WhatsApp style */}
          <div className="sticky top-0 z-20 flex items-center gap-3 px-3 py-2.5 border-b bg-[#25D366] text-white shadow-sm shrink-0">
            <Button
              onClick={handleBackToList}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-9 w-9 -ml-1 touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate leading-tight">
                  {selectedConversation?.contact_name || selectedConversation?.contact_phone || 'Conversa'}
                </p>
                <p className="text-xs opacity-90 truncate leading-tight">
                  {selectedConversation?.agent_key?.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <CRMChat
              conversationId={selectedConversationId}
              messages={messages}
              loading={messagesLoading}
              onRefresh={refetch}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMUnificado;
