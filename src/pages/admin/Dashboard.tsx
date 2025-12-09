import React, { useState, useMemo, useEffect } from 'react';
import { useMonthlyDashboardData } from '@/hooks/useMonthlyDashboardData';
import { useDashboardUnifiedStats } from '@/hooks/useDashboardUnifiedStats';
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';
import DashboardCharts from '@/components/admin/charts/DashboardCharts';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import DashboardFinancialSummary from '@/components/admin/dashboard/DashboardFinancialSummary';
import DashboardErrorState from '@/components/admin/dashboard/DashboardErrorState';
import DashboardLoadingState from '@/components/admin/dashboard/DashboardLoadingState';
import UnifiedStatsRow from '@/components/admin/dashboard/UnifiedStatsRow';
import AgentStatsRow from '@/components/admin/dashboard/AgentStatsRow';
import ProposalStatsRow from '@/components/admin/dashboard/ProposalStatsRow';
import CRMInboxPreview from '@/components/admin/dashboard/CRMInboxPreview';
import PanelsStatusCard from '@/components/admin/dashboard/PanelsStatusCard';
import RecentSalesCard from '@/components/admin/dashboard/RecentSalesCard';
import SellersRankingCard from '@/components/admin/dashboard/SellersRankingCard';
import { ElegantPeriodType, getElegantPeriodDates } from '@/components/admin/dashboard/ElegantPeriodButton';

const Dashboard = () => {
  console.log('🎯 [DASHBOARD] Componente renderizado');
  
  // Preferences hook for cross-device persistence
  const { 
    savedPeriod, 
    savePeriodEnabled, 
    loading: prefsLoading,
    updateSavePeriodEnabled,
    savePeriodPreference 
  } = useDashboardPreferences();
  
  const [periodFilter, setPeriodFilter] = useState<ElegantPeriodType>('today');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showSecondaryStats, setShowSecondaryStats] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize period from saved preference
  useEffect(() => {
    if (!prefsLoading && !initialized) {
      if (savedPeriod && savePeriodEnabled) {
        setPeriodFilter(savedPeriod);
      }
      setInitialized(true);
    }
  }, [prefsLoading, savedPeriod, savePeriodEnabled, initialized]);

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

        {/* Priority Cards Grid - Mobile: Stack, Desktop: 3 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CRMInboxPreview />
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
          <SellersRankingCard 
            vendedores={unifiedStats.propostasPorVendedor}
            loading={unifiedStats.loading}
          />
        </div>

        {/* Charts - Compactos */}
        <DashboardCharts data={chartData} />

        {/* Financial Summary - Compacto */}
        <DashboardFinancialSummary 
          stats={stats}
          periodFilter={periodFilter}
          growthData={growthData}
        />
      </div>
    </div>
  );
};

export default Dashboard;
