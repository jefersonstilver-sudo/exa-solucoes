
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
import ActivityTestPanel from '@/components/admin/dashboard/ActivityTestPanel';

const Dashboard = () => {
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

  if (error) {
    return <DashboardErrorState error={error} onRefetch={refetch} />;
  }

  if (loading) {
    return <DashboardLoadingState />;
  }

  if (!stats) {
    return <DashboardErrorState error="Dados não encontrados" onRefetch={refetch} />;
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardActivities stats={stats} />
        <DashboardQuickActions stats={stats} />
      </div>

      {/* Painel de Testes - Sistema de Monitoramento */}
      <ActivityTestPanel />

      <DashboardFinancialSummary 
        stats={stats}
        selectedMonth={selectedMonth}
        growthData={growthData}
      />
    </div>
  );
};

export default Dashboard;
