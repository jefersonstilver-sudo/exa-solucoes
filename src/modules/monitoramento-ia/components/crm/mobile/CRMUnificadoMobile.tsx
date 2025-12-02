import React, { useState, useEffect, useRef } from 'react';
import { MobileCRMHeader } from './MobileCRMHeader';
import { MobileCRMFilters } from './MobileCRMFilters';
import { MobileCRMMetrics } from './MobileCRMMetrics';
import { MobileConversationItem } from './MobileConversationItem';
import { MobileChatView } from './MobileChatView';
import { useUnifiedConversations } from '../../../hooks/useUnifiedConversations';
import { supabase } from '@/integrations/supabase/client';
import { AnimatePresence, motion } from 'framer-motion';
import PullToRefresh from '@/components/mobile/PullToRefresh';

interface CRMUnificadoMobileProps {
  initialFilters: any;
}

export const CRMUnificadoMobile: React.FC<CRMUnificadoMobileProps> = ({ initialFilters }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [showChat, setShowChat] = useState(false);
  const [agents, setAgents] = useState<Array<{ key: string; display_name: string }>>([]);
  
  // Pull to refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Filtrar conversas silenciadas da lista (opcionalmente)
  const filteredConversations = filters.unreadOnly 
    ? conversations.filter(c => !c.is_muted)
    : conversations;

  // Buscar agentes
  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await supabase
        .from('agents')
        .select('key, display_name')
        .eq('is_active', true);
      if (data) setAgents(data);
    };
    fetchAgents();
  }, []);

  const handleConversationSelect = (id: string) => {
    selectConversation(id);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Pull to refresh logic
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0 && !isRefreshing) {
      const touchY = e.touches[0].clientY;
      const distance = touchY - touchStartY.current;
      
      if (distance > 0 && distance < 150) {
        setPullDistance(distance);
        setIsPulling(true);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 80 && !isRefreshing) {
      handleRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  const selectedConversation = filteredConversations.find(c => c.id === selectedConversationId);

  return (
    <div className="h-[100dvh] flex flex-col fixed inset-0 z-50 bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {!showChat ? (
          // Lista de Conversas
          <motion.div
            key="list"
            initial={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <MobileCRMHeader
              unreadCount={metrics.unread}
              onMenuClick={() => {}} // Sidebar now managed by unified layout
              onSearchClick={() => {}}
              onRefreshClick={handleRefresh}
            />

            {/* Métricas */}
            <MobileCRMMetrics metrics={metrics} />

            {/* Filtros */}
            <MobileCRMFilters
              filters={filters}
              onFilterChange={setFilters}
              agents={agents}
            />

            {/* Pull to Refresh Indicator */}
            <PullToRefresh
              isRefreshing={isRefreshing}
              isPulling={isPulling}
              pullDistance={pullDistance}
              threshold={80}
            />

            {/* Lista de Conversas */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto custom-scrollbar pb-safe"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-module-secondary py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-[#25D366] border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm">Carregando conversas...</p>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-module-secondary py-8 px-4">
                    <p className="text-sm">Nenhuma conversa encontrada</p>
                  </div>
                </div>
              ) : (
                <div className="pb-safe">
                  {filteredConversations.map((conv, index) => (
                    <MobileConversationItem
                      key={conv.id}
                      conversation={conv}
                      isSelected={selectedConversationId === conv.id}
                      onClick={() => handleConversationSelect(conv.id)}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          // Chat View
          <MobileChatView
            key="chat"
            conversationId={selectedConversationId!}
            conversation={selectedConversation}
            messages={messages}
            loading={messagesLoading}
            onBack={handleBackToList}
            onRefresh={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
