import React, { useState } from 'react';
import { useConversations } from '../hooks/useConversations';
import { ConversationList } from '../components/conversations/ConversationList';
import { ConversationDetail } from '../components/conversations/ConversationDetail';
import { RefreshCw, ArrowLeft } from 'lucide-react';
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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
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
              transition={{ duration: 0.2 }}
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
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-background flex flex-col"
            >
              {/* Header mobile com botão voltar */}
              <div className="shrink-0 flex items-center gap-2 p-3 border-b bg-[#25D366] text-white">
                <Button
                  onClick={handleBackToList}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold">
                      {phoneNumber?.slice(-2) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{phoneNumber}</p>
                    <p className="text-xs opacity-90 truncate">
                      {agentKey?.replace('_', ' ').toUpperCase()}
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
