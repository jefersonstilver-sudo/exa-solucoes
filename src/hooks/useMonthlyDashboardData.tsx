
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
  current: MonthlyDashboardStats;
  previous: MonthlyDashboardStats;
}

export interface MonthlyChartData {
  revenueData: Array<{ month: string; revenue: number }>;
  orderStatusData: Array<{ name: string; value: number; color: string }>;
  userGrowthData: Array<{ month: string; users: number }>;
  panelStatusData: Array<{ status: string; count: number }>;
  last12Months: MonthlyDashboardStats[];
}

export const useMonthlyDashboardData = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  
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

  const parseMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    return { year, month };
  };

  const fetchMonthlyStats = useCallback(async (monthStr: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { year, month } = parseMonthYear(monthStr);
      
      // Buscar dados do mês selecionado
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('get_dashboard_stats_by_month', { p_year: year, p_month: month });
      
      if (monthlyError) throw monthlyError;
      
      // Buscar comparação com mês anterior
      const { data: comparisonData, error: comparisonError } = await supabase
        .rpc('get_monthly_comparison', { p_year: year, p_month: month });
      
      if (comparisonError) throw comparisonError;
      
      // Buscar histórico dos últimos 12 meses
      const { data: historyData, error: historyError } = await supabase
        .rpc('get_last_12_months_stats');
      
      if (historyError) throw historyError;
      
      // Type casting with proper validation
      const typedMonthlyData = monthlyData as MonthlyDashboardStats;
      const typedComparisonData = comparisonData as MonthlyComparison;
      const typedHistoryData = historyData as { months: MonthlyDashboardStats[] };
      
      setStats(typedMonthlyData);
      setComparison(typedComparisonData);
      
      // Processar dados para gráficos
      if (typedHistoryData?.months) {
        const months = typedHistoryData.months;
        
        setChartData({
          revenueData: months.map((month: MonthlyDashboardStats) => ({
            month: month.month_year,
            revenue: Number(month.monthly_revenue) || 0
          })),
          orderStatusData: [
            { name: 'Ativos', value: typedMonthlyData.active_orders, color: '#10b981' },
            { name: 'Pendentes', value: typedMonthlyData.pending_orders, color: '#f97316' },
          ].filter(item => item.value > 0),
          userGrowthData: months.map((month: MonthlyDashboardStats) => ({
            month: month.month_year,
            users: month.total_users_accumulated || 0
          })),
          panelStatusData: [
            { status: 'Online', count: typedMonthlyData.online_panels },
            { status: 'Offline', count: typedMonthlyData.total_panels_accumulated - typedMonthlyData.online_panels }
          ].filter(item => item.count > 0),
          last12Months: months
        });
      }
      
    } catch (err) {
      console.error('Erro ao buscar dados mensais:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMonthChange = useCallback((newMonth: string) => {
    setSelectedMonth(newMonth);
    // Salvar no localStorage para persistir seleção
    localStorage.setItem('dashboard-selected-month', newMonth);
  }, []);

  // Carregar mês selecionado do localStorage na inicialização
  useEffect(() => {
    const savedMonth = localStorage.getItem('dashboard-selected-month');
    if (savedMonth) {
      setSelectedMonth(savedMonth);
    }
  }, []);

  // Buscar dados quando o mês selecionado muda
  useEffect(() => {
    fetchMonthlyStats(selectedMonth);
  }, [selectedMonth, fetchMonthlyStats]);

  const calculateGrowthPercentage = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getGrowthData = useCallback(() => {
    if (!comparison) return null;
    
    return {
      users: calculateGrowthPercentage(
        comparison.current.total_users, 
        comparison.previous.total_users
      ),
      revenue: calculateGrowthPercentage(
        comparison.current.monthly_revenue, 
        comparison.previous.monthly_revenue
      ),
      orders: calculateGrowthPercentage(
        comparison.current.total_orders, 
        comparison.previous.total_orders
      ),
      buildings: calculateGrowthPercentage(
        comparison.current.total_buildings, 
        comparison.previous.total_buildings
      )
    };
  }, [comparison]);

  return {
    selectedMonth,
    stats,
    comparison,
    chartData,
    loading,
    error,
    handleMonthChange,
    refetch: () => fetchMonthlyStats(selectedMonth),
    growthData: getGrowthData()
  };
};
