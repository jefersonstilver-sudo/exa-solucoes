import React, { useState, useMemo } from 'react';
import { useMonthlyDashboardData } from '@/hooks/useMonthlyDashboardData';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import DashboardCharts from '@/components/admin/charts/DashboardCharts';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import DashboardStatsCards from '@/components/admin/dashboard/DashboardStatsCards';
import DashboardFinancialSummary from '@/components/admin/dashboard/DashboardFinancialSummary';
import DashboardErrorState from '@/components/admin/dashboard/DashboardErrorState';
import DashboardLoadingState from '@/components/admin/dashboard/DashboardLoadingState';
import QuickStatsRow from '@/components/admin/dashboard/QuickStatsRow';
import CRMInboxPreview from '@/components/admin/dashboard/CRMInboxPreview';
import PanelsStatusCard from '@/components/admin/dashboard/PanelsStatusCard';
import RecentSalesCard from '@/components/admin/dashboard/RecentSalesCard';
import { PeriodType, getPeriodDates } from '@/components/admin/common/AdminPeriodSelector';

const Dashboard = () => {
  console.log('🎯 [DASHBOARD] Componente renderizado');
  
  const [periodFilter, setPeriodFilter] = useState<PeriodType>('current_month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const { start, end } = useMemo(() => {
    return getPeriodDates(periodFilter, customStartDate, customEndDate);
  }, [periodFilter, customStartDate, customEndDate]);

  const { 
    stats, 
    chartData, 
    loading, 
    error,
    refetch,
    growthData
  } = useMonthlyDashboardData(start, end);

  const metrics = useDashboardMetrics();

  const handlePeriodChange = (period: PeriodType) => {
    setPeriodFilter(period);
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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--apple-gray-50))] via-white to-[hsl(var(--apple-gray-50))] p-2 md:p-4 lg:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6">
        {/* Header Compacto */}
        <DashboardHeader 
          periodFilter={periodFilter}
          onPeriodChange={handlePeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
          onRefetch={refetch}
        />

        {/* Quick Stats Row - Scroll Horizontal */}
        <QuickStatsRow metrics={metrics} />

        {/* Stats Cards - Grid Original */}
        <DashboardStatsCards 
          stats={stats}
          growthData={growthData}
        />

        {/* Priority Cards Grid - Mobile: Stack, Desktop: 3 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <CRMInboxPreview />
          <PanelsStatusCard metrics={metrics} />
          <RecentSalesCard />
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
