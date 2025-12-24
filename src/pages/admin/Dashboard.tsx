import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useMonthlyDashboardData } from '@/hooks/useMonthlyDashboardData';
import { useDashboardUnifiedStats } from '@/hooks/useDashboardUnifiedStats';
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';
import DashboardCharts from '@/components/admin/charts/DashboardCharts';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import DashboardGreeting from '@/components/admin/dashboard/DashboardGreeting';
import DashboardErrorState from '@/components/admin/dashboard/DashboardErrorState';
import DashboardLoadingState from '@/components/admin/dashboard/DashboardLoadingState';
import UnifiedStatsRow from '@/components/admin/dashboard/UnifiedStatsRow';
import AgentStatsRow from '@/components/admin/dashboard/AgentStatsRow';
import ProposalStatsRow from '@/components/admin/dashboard/ProposalStatsRow';
import PanelsStatusCard from '@/components/admin/dashboard/PanelsStatusCard';
import SellersRankingCard from '@/components/admin/dashboard/SellersRankingCard';
import ContratosAlertCard from '@/components/admin/dashboard/ContratosAlertCard';
import AlertasGeraisCard from '@/components/admin/dashboard/AlertasGeraisCard';
import SortableDashboardCard from '@/components/admin/dashboard/SortableDashboardCard';
import { ElegantPeriodType, getElegantPeriodDates } from '@/components/admin/dashboard/ElegantPeriodButton';

// Default order: Dispositivos, Contratos, Vendedores na primeira linha (3 cols)
const DEFAULT_CARDS_ORDER = ['panels', 'contracts', 'sellers', 'alerts'];

const Dashboard = () => {
  console.log('🎯 [DASHBOARD] Componente renderizado');
  
  // Preferences hook for cross-device persistence
  const { 
    savedPeriod, 
    savePeriodEnabled, 
    cardsOrder: savedCardsOrder,
    loading: prefsLoading,
    updateSavePeriodEnabled,
    savePeriodPreference,
    saveCardsOrder
  } = useDashboardPreferences();
  
  const [periodFilter, setPeriodFilter] = useState<ElegantPeriodType>('today');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showSecondaryStats, setShowSecondaryStats] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [cardsOrder, setCardsOrder] = useState<string[]>(DEFAULT_CARDS_ORDER);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sensors for drag with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  // Initialize period and cards order from saved preference
  useEffect(() => {
    if (!prefsLoading && !initialized) {
      if (savedPeriod && savePeriodEnabled) {
        setPeriodFilter(savedPeriod);
      }
      if (savedCardsOrder && savedCardsOrder.length > 0) {
        // Filter out removed cards (like 'proposals')
        const validCards = savedCardsOrder.filter(id => DEFAULT_CARDS_ORDER.includes(id) || id === 'proposals');
        const filteredCards = validCards.filter(id => id !== 'proposals');
        if (filteredCards.length > 0) {
          setCardsOrder(filteredCards);
        }
      }
      setInitialized(true);
    }
  }, [prefsLoading, savedPeriod, savePeriodEnabled, savedCardsOrder, initialized]);

  const { start, end } = useMemo(() => {
    return getElegantPeriodDates(periodFilter, customStartDate, customEndDate);
  }, [periodFilter, customStartDate, customEndDate]);

  const { 
    stats, 
    chartData, 
    loading, 
    error,
    refetch,
    growthData
  } = useMonthlyDashboardData(start, end);

  const { stats: unifiedStats, refetch: refetchUnified } = useDashboardUnifiedStats(start, end);

  const handlePeriodChange = (period: ElegantPeriodType) => {
    setPeriodFilter(period);
    // Save to database if preference is enabled
    savePeriodPreference(period);
  };

  const handleSavePeriodChange = (enabled: boolean) => {
    updateSavePeriodEnabled(enabled, periodFilter);
  };

  const handleCustomDateChange = (start: Date | undefined, end: Date | undefined) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end for reordering cards
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const oldIndex = cardsOrder.indexOf(active.id as string);
      const newIndex = cardsOrder.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(cardsOrder, oldIndex, newIndex);
        setCardsOrder(newOrder);
        // Persist automatically
        saveCardsOrder(newOrder);
      }
    }
  }, [cardsOrder, saveCardsOrder]);

  // Render card by ID
  const renderCard = useCallback((cardId: string) => {
    switch (cardId) {
      case 'panels':
        return (
          <PanelsStatusCard 
            metrics={{
              unreadConversations: 0,
              panelsOnline: unifiedStats.devicesOnline,
              panelsTotal: unifiedStats.devicesTotal,
              todayRevenue: 0,
              pendingOrders: 0,
              panelsOffline: unifiedStats.devicesOffline,
              loading: unifiedStats.loading,
              isRealtimeConnected: true,
              lastUpdate: new Date()
            }}
            quedasPeriodo={unifiedStats.quedasPeriodo}
          />
        );
      case 'sellers':
        return (
          <SellersRankingCard 
            vendedores={unifiedStats.propostasPorVendedor}
            loading={unifiedStats.loading}
          />
        );
      case 'contracts':
        return <ContratosAlertCard />;
      case 'alerts':
        return <AlertasGeraisCard />;
      default:
        return null;
    }
  }, [unifiedStats]);


  console.log('🎯 [DASHBOARD] Estado atual:', {
    loading,
    hasError: !!error,
    hasStats: !!stats,
    periodFilter
  });

  if (error) {
    console.error('❌ [DASHBOARD] Erro detectado:', error);
    return <DashboardErrorState error={error} onRefetch={refetch} />;
  }

  if (loading) {
    console.log('⏳ [DASHBOARD] Carregando dados...');
    return <DashboardLoadingState />;
  }

  if (!stats) {
    console.warn('⚠️ [DASHBOARD] Stats não encontrados');
    return <DashboardErrorState error="Dados não encontrados" onRefetch={refetch} />;
  }

  console.log('✅ [DASHBOARD] Renderizando dashboard completo');
  
  return (
    <div className="min-h-screen bg-white p-2 md:p-3 lg:p-4">
      <div className="max-w-[2000px] mx-auto space-y-3 md:space-y-4">
        {/* Header com seletor de período - topo */}
        <DashboardHeader 
          periodFilter={periodFilter}
          onPeriodChange={handlePeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
          showSecondaryStats={showSecondaryStats}
          onToggleSecondaryStats={() => setShowSecondaryStats(!showSecondaryStats)}
          savePeriodEnabled={savePeriodEnabled}
          onSavePeriodChange={handleSavePeriodChange}
        />
        
        {/* Personalized Greeting - mobile only */}
        <DashboardGreeting />

        {/* Unified Stats Row - Nova linha única com 6 cards elegantes */}
        <UnifiedStatsRow stats={unifiedStats} />

        {/* Agent Stats Row - Segunda linha com métricas por agente */}
        {showSecondaryStats && (
          <>
            <AgentStatsRow stats={unifiedStats} />
            <ProposalStatsRow stats={unifiedStats} />
          </>
        )}

        {/* Priority Cards Grid with Drag and Drop */}
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={cardsOrder} strategy={rectSortingStrategy}>
            {/* All 4 cards in grid with equal heights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
              {cardsOrder.map(cardId => (
                <SortableDashboardCard key={cardId} id={cardId} isDragging={activeId === cardId}>
                  {renderCard(cardId)}
                </SortableDashboardCard>
              ))}
            </div>
          </SortableContext>

          {/* DragOverlay for ultra-fluid visual dragging */}
          {createPortal(
            <DragOverlay 
              dropAnimation={{
                duration: 450,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {activeId && (
                <motion.div 
                  initial={{ scale: 1, rotate: 0, opacity: 0.9 }}
                  animate={{ 
                    scale: 1.06, 
                    rotate: 0.8,
                    opacity: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 280,
                    damping: 22,
                    mass: 1.1
                  }}
                  className="rounded-2xl shadow-[0_35px_70px_-15px_rgba(0,0,0,0.4)]"
                >
                  {renderCard(activeId)}
                </motion.div>
              )}
            </DragOverlay>,
            document.body
          )}
        </DndContext>

        {/* Charts - Compactos */}
        <DashboardCharts data={chartData} />
      </div>
    </div>
  );
};

export default Dashboard;