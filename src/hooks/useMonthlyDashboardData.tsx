
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyDashboardStats {
  total_users: number;
  total_users_accumulated: number;
  total_buildings: number;
  total_buildings_accumulated: number;
  total_orders: number;
  total_panels: number;
  total_panels_accumulated: number;
  monthly_revenue: number;
  active_orders: number;
  pending_orders: number;
  online_panels: number;
  month_year: string;
}

export interface MonthlyComparison {
  current: {
    monthly_revenue: number;
    total_orders: number;
    total_users: number;
    total_buildings: number;
  };
  previous: {
    monthly_revenue: number;
    total_orders: number;
    total_users: number;
    total_buildings: number;
  };
}

export interface MonthlyChartData {
  revenueData: Array<{ month: string; revenue: number }>;
  orderStatusData: Array<{ name: string; value: number; color: string }>;
  userGrowthData: Array<{ month: string; users: number }>;
  panelStatusData: Array<{ status: string; count: number }>;
  last12Months: MonthlyDashboardStats[];
}

const convertToMonthlyStats = (data: any): MonthlyDashboardStats => {
  return {
    total_users: Number(data?.total_users) || 0,
    total_users_accumulated: Number(data?.total_users_accumulated) || 0,
    total_buildings: Number(data?.total_buildings) || 0,
    total_buildings_accumulated: Number(data?.total_buildings_accumulated) || 0,
    total_orders: Number(data?.total_orders) || 0,
    total_panels: Number(data?.total_panels) || 0,
    total_panels_accumulated: Number(data?.total_panels_accumulated) || 0,
    monthly_revenue: Number(data?.monthly_revenue) || 0,
    active_orders: Number(data?.active_orders) || 0,
    pending_orders: Number(data?.pending_orders) || 0,
    online_panels: Number(data?.online_panels) || 0,
    month_year: data?.month_year || 'N/A',
  };
};

const convertToMonthlyComparison = (data: any): MonthlyComparison => {
  return {
    current: {
      monthly_revenue: Number(data?.current?.monthly_revenue) || 0,
      total_orders: Number(data?.current?.total_orders) || 0,
      total_users: Number(data?.current?.total_users) || 0,
      total_buildings: Number(data?.current?.total_buildings) || 0,
    },
    previous: {
      monthly_revenue: Number(data?.previous?.monthly_revenue) || 0,
      total_orders: Number(data?.previous?.total_orders) || 0,
      total_users: Number(data?.previous?.total_users) || 0,
      total_buildings: Number(data?.previous?.total_buildings) || 0,
    }
  };
};

const convertToMonthlyStatsArray = (data: any): MonthlyDashboardStats[] => {
  if (!data?.months || !Array.isArray(data.months)) {
    return [];
  }
  return data.months.map((month: any) => convertToMonthlyStats(month));
};

export const useMonthlyDashboardData = (startDate?: Date, endDate?: Date) => {
  const [stats, setStats] = useState<MonthlyDashboardStats | null>(null);
  const [comparison, setComparison] = useState<MonthlyComparison | null>(null);
  const [chartData, setChartData] = useState<MonthlyChartData>({
    revenueData: [],
    orderStatusData: [],
    userGrowthData: [],
    panelStatusData: [],
    last12Months: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlyStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Se não houver datas, buscar dados de todos os tempos
      if (!startDate && !endDate) {
        console.log(`🔍 Buscando dados de TODOS OS TEMPOS`);
        
        const { data: historyData, error: historyError } = await supabase
          .rpc('get_last_12_months_stats');
        
        if (historyError) {
          console.error('❌ Erro ao buscar histórico:', historyError);
          throw historyError;
        }
        
        const typedHistoryData = convertToMonthlyStatsArray(historyData);
        
        const aggregatedStats: MonthlyDashboardStats = {
          total_users: typedHistoryData.length > 0 ? Math.max(...typedHistoryData.map(m => m.total_users_accumulated)) : 0,
          total_users_accumulated: typedHistoryData.length > 0 ? Math.max(...typedHistoryData.map(m => m.total_users_accumulated)) : 0,
          total_buildings: typedHistoryData.length > 0 ? Math.max(...typedHistoryData.map(m => m.total_buildings_accumulated)) : 0,
          total_buildings_accumulated: typedHistoryData.length > 0 ? Math.max(...typedHistoryData.map(m => m.total_buildings_accumulated)) : 0,
          total_orders: typedHistoryData.reduce((sum, m) => sum + m.total_orders, 0),
          total_panels: typedHistoryData.length > 0 ? Math.max(...typedHistoryData.map(m => m.total_panels_accumulated)) : 0,
          total_panels_accumulated: typedHistoryData.length > 0 ? Math.max(...typedHistoryData.map(m => m.total_panels_accumulated)) : 0,
          monthly_revenue: typedHistoryData.reduce((sum, m) => sum + m.monthly_revenue, 0),
          active_orders: typedHistoryData.length > 0 ? typedHistoryData[typedHistoryData.length - 1].active_orders : 0,
          pending_orders: typedHistoryData.length > 0 ? typedHistoryData[typedHistoryData.length - 1].pending_orders : 0,
          online_panels: typedHistoryData.length > 0 ? typedHistoryData[typedHistoryData.length - 1].online_panels : 0,
          month_year: 'Todos os Períodos'
        };
        
        setStats(aggregatedStats);
        setComparison(null);
        
        setChartData({
          revenueData: typedHistoryData.map((month: MonthlyDashboardStats) => ({
            month: month.month_year,
            revenue: Number(month.monthly_revenue) || 0
          })).reverse(),
          orderStatusData: [
            { name: 'Ativos', value: aggregatedStats.active_orders, color: '#10b981' },
            { name: 'Pendentes', value: aggregatedStats.pending_orders, color: '#f97316' },
            { name: 'Total', value: aggregatedStats.total_orders, color: '#6366f1' }
          ].filter(item => item.value > 0),
          userGrowthData: typedHistoryData.map((month: MonthlyDashboardStats) => ({
            month: month.month_year,
            users: month.total_users_accumulated || 0
          })).reverse(),
          panelStatusData: [
            { status: 'Online', count: aggregatedStats.online_panels },
            { status: 'Offline', count: Math.max(0, aggregatedStats.total_panels_accumulated - aggregatedStats.online_panels) }
          ].filter(item => item.count > 0),
          last12Months: typedHistoryData
        });
        
        setLoading(false);
        return;
      }
      
      // Se há uma data específica (mesmo para o mês atual)
      const targetDate = startDate || new Date();
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      console.log(`🔍 Buscando dados para: ${year}-${month}`);
      
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('get_dashboard_stats_by_month', { p_year: year, p_month: month });
      
      if (monthlyError) {
        console.error('❌ Erro ao buscar dados mensais:', monthlyError);
        throw monthlyError;
      }
      
      const { data: comparisonData, error: comparisonError } = await supabase
        .rpc('get_monthly_comparison', { p_year: year, p_month: month });
      
      if (comparisonError) {
        console.error('❌ Erro ao buscar comparação:', comparisonError);
        throw comparisonError;
      }
      
      const { data: historyData, error: historyError } = await supabase
        .rpc('get_last_12_months_stats');
      
      if (historyError) {
        console.error('❌ Erro ao buscar histórico:', historyError);
        throw historyError;
      }
      
      const typedMonthlyData = convertToMonthlyStats(monthlyData);
      const typedComparisonData = convertToMonthlyComparison(comparisonData);
      const typedHistoryData = convertToMonthlyStatsArray(historyData);
      
      setStats(typedMonthlyData);
      setComparison(typedComparisonData);
      
      if (typedHistoryData && typedHistoryData.length > 0) {
        setChartData({
          revenueData: typedHistoryData.map((month: MonthlyDashboardStats) => ({
            month: month.month_year,
            revenue: Number(month.monthly_revenue) || 0
          })).reverse(),
          orderStatusData: [
            { name: 'Ativos', value: typedMonthlyData.active_orders, color: '#10b981' },
            { name: 'Pendentes', value: typedMonthlyData.pending_orders, color: '#f97316' },
            { name: 'Total', value: typedMonthlyData.total_orders, color: '#6366f1' }
          ].filter(item => item.value > 0),
          userGrowthData: typedHistoryData.map((month: MonthlyDashboardStats) => ({
            month: month.month_year,
            users: month.total_users_accumulated || 0
          })).reverse(),
          panelStatusData: [
            { status: 'Online', count: typedMonthlyData.online_panels },
            { status: 'Offline', count: Math.max(0, typedMonthlyData.total_panels_accumulated - typedMonthlyData.online_panels) }
          ].filter(item => item.count > 0),
          last12Months: typedHistoryData
        });
      }
      
    } catch (err) {
      console.error('💥 Erro crítico ao buscar dados:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, [startDate?.getTime(), endDate?.getTime()]);

  useEffect(() => {
    fetchMonthlyStats();

    // Real-time subscriptions for dashboard data
    const channels = [
      supabase.channel('monthly-pedidos-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
          console.log('[useMonthlyDashboardData] Pedidos changed - refreshing');
          fetchMonthlyStats();
        })
        .subscribe(),
      supabase.channel('monthly-users-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          console.log('[useMonthlyDashboardData] Users changed - refreshing');
          fetchMonthlyStats();
        })
        .subscribe(),
      supabase.channel('monthly-buildings-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'buildings' }, () => {
          console.log('[useMonthlyDashboardData] Buildings changed - refreshing');
          fetchMonthlyStats();
        })
        .subscribe(),
      supabase.channel('monthly-devices-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
          console.log('[useMonthlyDashboardData] Devices changed - refreshing');
          fetchMonthlyStats();
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [fetchMonthlyStats]);

  const refetch = useCallback(() => {
    fetchMonthlyStats();
  }, [fetchMonthlyStats]);

  const growthData = comparison ? {
    users: comparison.previous.total_users > 0 
      ? ((comparison.current.total_users - comparison.previous.total_users) / comparison.previous.total_users) * 100 
      : 0,
    revenue: comparison.previous.monthly_revenue > 0 
      ? ((comparison.current.monthly_revenue - comparison.previous.monthly_revenue) / comparison.previous.monthly_revenue) * 100 
      : 0,
    orders: comparison.previous.total_orders > 0 
      ? ((comparison.current.total_orders - comparison.previous.total_orders) / comparison.previous.total_orders) * 100 
      : 0,
    buildings: comparison.previous.total_buildings > 0 
      ? ((comparison.current.total_buildings - comparison.previous.total_buildings) / comparison.previous.total_buildings) * 100 
      : 0,
  } : null;

  return {
    stats,
    chartData,
    loading,
    error,
    refetch,
    growthData
  };
};
