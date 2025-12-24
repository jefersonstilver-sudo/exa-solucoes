import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
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
import ProposalsAlertCard from '@/components/admin/dashboard/ProposalsAlertCard';
import PanelsStatusCard from '@/components/admin/dashboard/PanelsStatusCard';
import SellersRankingCard from '@/components/admin/dashboard/SellersRankingCard';
import ContratosAlertCard from '@/components/admin/dashboard/ContratosAlertCard';
import AlertasGeraisCard from '@/components/admin/dashboard/AlertasGeraisCard';
import SortableDashboardCard from '@/components/admin/dashboard/SortableDashboardCard';
import { ElegantPeriodType, getElegantPeriodDates } from '@/components/admin/dashboard/ElegantPeriodButton';

const DEFAULT_CARDS_ORDER = ['proposals', 'panels', 'sellers', 'contracts', 'alerts'];

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
        setCardsOrder(savedCardsOrder);
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

  // Handle drag end for reordering cards
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
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
      case 'proposals':
        return <ProposalsAlertCard />;
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

  // Separate cards into rows
  const row1Cards = cardsOrder.slice(0, 3);
  const row2Cards = cardsOrder.slice(3);

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
    <div className="min-h-screen bg-white p-2 md:p-4 lg:p-6">
      <div className="max-w-[2000px] mx-auto space-y-4 md:space-y-6">
        {/* Personalized Greeting */}
        <DashboardGreeting />
        {/* Header Compacto */}
        <DashboardHeader 
          periodFilter={periodFilter}
          onPeriodChange={handlePeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
          onRefetch={refetch}
          showSecondaryStats={showSecondaryStats}
          onToggleSecondaryStats={() => setShowSecondaryStats(!showSecondaryStats)}
          savePeriodEnabled={savePeriodEnabled}
          onSavePeriodChange={handleSavePeriodChange}
        />

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
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={cardsOrder} strategy={rectSortingStrategy}>
            {/* Row 1: 3 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {row1Cards.map(cardId => (
                <SortableDashboardCard key={cardId} id={cardId}>
                  {renderCard(cardId)}
                </SortableDashboardCard>
              ))}
            </div>

            {/* Row 2: 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {row2Cards.map(cardId => (
                <SortableDashboardCard key={cardId} id={cardId}>
                  {renderCard(cardId)}
                </SortableDashboardCard>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Charts - Compactos */}
        <DashboardCharts data={chartData} />
      </div>
    </div>
  );
};

export default Dashboard;
