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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Home, Settings, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CRMUnificadoMobileProps {
  initialFilters: any;
}

export const CRMUnificadoMobile: React.FC<CRMUnificadoMobileProps> = ({ initialFilters }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [showChat, setShowChat] = useState(false);
  const [agents, setAgents] = useState<Array<{ key: string; display_name: string }>>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  
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
    <div className="h-[100dvh] flex flex-col fixed inset-0 z-50 bg-module-primary overflow-hidden">
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
              onMenuClick={() => setIsDrawerOpen(true)}
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

      {/* Mobile Drawer Menu */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px]">
          <SheetHeader>
            <SheetTitle className="text-left">Menu</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-1">
            <button
              onClick={() => {
                navigate('/monitoramento-ia');
                setIsDrawerOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                navigate('/monitoramento-ia/crm-unificado');
                setIsDrawerOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left bg-accent rounded-lg"
            >
              <User className="w-5 h-5" />
              <span>CRM Unificado</span>
            </button>

            <button
              onClick={() => {
                navigate('/monitoramento-ia/configuracoes');
                setIsDrawerOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Configurações</span>
            </button>
          </div>

          <div className="absolute bottom-6 left-0 right-0 px-4">
            <button
              onClick={() => {
                navigate('/login');
                setIsDrawerOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
