import React, { useState, useMemo } from 'react';
import { useMonthlyDashboardData } from '@/hooks/useMonthlyDashboardData';
import DashboardCharts from '@/components/admin/charts/DashboardCharts';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import DashboardStatsCards from '@/components/admin/dashboard/DashboardStatsCards';
import DashboardActivities from '@/components/admin/dashboard/DashboardActivities';
import DashboardQuickActions from '@/components/admin/dashboard/DashboardQuickActions';
import DashboardFinancialSummary from '@/components/admin/dashboard/DashboardFinancialSummary';
import DashboardErrorState from '@/components/admin/dashboard/DashboardErrorState';
import DashboardLoadingState from '@/components/admin/dashboard/DashboardLoadingState';
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
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--apple-gray-50))] via-white to-[hsl(var(--apple-gray-50))] p-3 md:p-6 safe-area-top">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
        <DashboardHeader 
          periodFilter={periodFilter}
          onPeriodChange={handlePeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
          onRefetch={refetch}
        />

        <DashboardStatsCards 
          stats={stats}
          growthData={growthData}
        />

        <DashboardCharts data={chartData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <DashboardActivities stats={stats} />
          <DashboardQuickActions stats={stats} />
        </div>

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
