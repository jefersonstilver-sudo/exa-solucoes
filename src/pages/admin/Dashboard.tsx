
import React from 'react';
import { useMonthlyDashboardData } from '@/hooks/useMonthlyDashboardData';
import DashboardCharts from '@/components/admin/charts/DashboardCharts';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import DashboardStatsCards from '@/components/admin/dashboard/DashboardStatsCards';
import DashboardActivities from '@/components/admin/dashboard/DashboardActivities';
import DashboardQuickActions from '@/components/admin/dashboard/DashboardQuickActions';
import DashboardFinancialSummary from '@/components/admin/dashboard/DashboardFinancialSummary';
import DashboardErrorState from '@/components/admin/dashboard/DashboardErrorState';
import DashboardLoadingState from '@/components/admin/dashboard/DashboardLoadingState';

const Dashboard = () => {
  console.log('🎯 [DASHBOARD] Componente renderizado');
  
  const { 
    selectedMonth, 
    stats, 
    chartData, 
    loading, 
    error,
    handleMonthChange,
    refetch,
    growthData
  } = useMonthlyDashboardData();

  console.log('🎯 [DASHBOARD] Estado atual:', {
    loading,
    hasError: !!error,
    hasStats: !!stats,
    selectedMonth
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
    <div className="space-y-6 md:space-y-8 p-3 md:p-6 bg-gray-50 min-h-screen">
      <DashboardHeader 
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
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
        selectedMonth={selectedMonth}
        growthData={growthData}
      />
    </div>
  );
};

export default Dashboard;
