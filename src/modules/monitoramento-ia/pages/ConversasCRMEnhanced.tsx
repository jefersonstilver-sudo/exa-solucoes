import React, { useState } from 'react';
import { useConversations } from '../hooks/useConversations';
import { ConversationList } from '../components/conversations/ConversationList';
import { ConversationDetail } from '../components/conversations/ConversationDetail';
import { RefreshCw, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CRMHeader } from '../components/crm/CRMHeader';
import { CRMMetrics } from '../types/crmTypes';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { motion, AnimatePresence } from 'framer-motion';

export const ConversasCRMEnhanced: React.FC = () => {
  const {
    conversations,
    messages,
    loading,
    messagesLoading,
    selectedConversation,
    selectConversation,
    refetch,
  } = useConversations();

  // Estado para controlar visualização mobile
  const [showMobileChat, setShowMobileChat] = useState(false);

  const metrics: CRMMetrics = {
    total: conversations.length,
    unread: conversations.filter(c => c.unread_count > 0).length,
    today: conversations.filter(c => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(c.last_message_at) >= today;
    }).length,
    responseRate: 0,
    avgResponseTime: 0
  };

  const [phoneNumber, agentKey] = selectedConversation?.split('_') || [null, null];

  const handleSelectConversation = (phone: string, agent: string) => {
    selectConversation(phone, agent);
    setShowMobileChat(true); // Abrir chat no mobile
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header - Oculto no mobile quando chat aberto */}
      <div className={`${showMobileChat ? 'hidden md:block' : 'block'} p-4 border-b bg-card shrink-0`}>
        <CRMHeader
          metrics={metrics}
          filters={{}}
          onFilterChange={() => {}}
          onRefresh={refetch}
        />
      </div>

      {/* Layout Desktop - Resizable panels */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelect={selectConversation}
              loading={loading}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle className="w-1 bg-border hover:bg-border/80" />
          
          <ResizablePanel defaultSize={70}>
            <ConversationDetail
              messages={messages}
              loading={messagesLoading}
              phoneNumber={phoneNumber}
              agentKey={agentKey}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Layout Mobile - Fullscreen alternado */}
      <div className="flex md:hidden flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!showMobileChat ? (
            // Lista de conversas em fullscreen
            <motion.div
              key="list"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 bg-background"
            >
              <ConversationList
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelect={handleSelectConversation}
                loading={loading}
              />
            </motion.div>
          ) : (
            // Chat em fullscreen com botão voltar
            <motion.div
              key="chat"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 bg-background flex flex-col"
            >
              {/* Header mobile minimalista - WhatsApp style */}
              <div className="sticky top-0 z-20 flex items-center gap-3 px-3 py-2.5 border-b bg-[#25D366] text-white shadow-sm">
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
                      {phoneNumber}
                    </p>
                    <p className="text-xs opacity-90 truncate leading-tight">
                      {agentKey?.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 overflow-hidden">
                <ConversationDetail
                  messages={messages}
                  loading={messagesLoading}
                  phoneNumber={phoneNumber}
                  agentKey={agentKey}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
