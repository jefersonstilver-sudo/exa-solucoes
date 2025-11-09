
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

// Helper function to safely convert JSON to MonthlyDashboardStats
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
    month_year: String(data?.month_year) || ''
  };
};

// Helper function to safely convert JSON to MonthlyComparison
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

// Helper function to safely convert JSON array to MonthlyDashboardStats array
const convertToMonthlyStatsArray = (data: any): MonthlyDashboardStats[] => {
  if (!data?.months || !Array.isArray(data.months)) {
    return [];
  }
  
  return data.months.map((month: any) => convertToMonthlyStats(month));
};

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
      
      // Se for "all", buscar dados de todos os tempos
      if (monthStr === 'all') {
        console.log(`🔍 Buscando dados de TODOS OS TEMPOS`);
        
        // Buscar histórico completo
        const { data: historyData, error: historyError } = await supabase
          .rpc('get_last_12_months_stats');
        
        if (historyError) {
          console.error('❌ Erro ao buscar histórico:', historyError);
          throw historyError;
        }
        
        const typedHistoryData = convertToMonthlyStatsArray(historyData);
        
        // Agregar todos os dados
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
          month_year: 'Todos os Tempos'
        };
        
        setStats(aggregatedStats);
        setComparison(null); // Sem comparação para "todos os tempos"
        
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
      
      const { year, month } = parseMonthYear(monthStr);
      
      console.log(`🔍 Buscando dados para: ${year}-${month}`);
      
      // Buscar dados do mês selecionado
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('get_dashboard_stats_by_month', { p_year: year, p_month: month });
      
      if (monthlyError) {
        console.error('❌ Erro ao buscar dados mensais:', monthlyError);
        throw monthlyError;
      }
      
      console.log('📊 Dados mensais recebidos:', monthlyData);
      
      // Buscar comparação com mês anterior
      const { data: comparisonData, error: comparisonError } = await supabase
        .rpc('get_monthly_comparison', { p_year: year, p_month: month });
      
      if (comparisonError) {
        console.error('❌ Erro ao buscar comparação:', comparisonError);
        throw comparisonError;
      }
      
      console.log('📈 Dados de comparação recebidos:', comparisonData);
      
      // Buscar histórico dos últimos 12 meses
      const { data: historyData, error: historyError } = await supabase
        .rpc('get_last_12_months_stats');
      
      if (historyError) {
        console.error('❌ Erro ao buscar histórico:', historyError);
        throw historyError;
      }
      
      console.log('📅 Histórico de 12 meses recebido:', historyData);
      
      // Conversão segura dos dados com validação
      const typedMonthlyData = convertToMonthlyStats(monthlyData);
      const typedComparisonData = convertToMonthlyComparison(comparisonData);
      const typedHistoryData = convertToMonthlyStatsArray(historyData);
      
      setStats(typedMonthlyData);
      setComparison(typedComparisonData);
      
      // Processar dados para gráficos usando os últimos 12 meses
      if (typedHistoryData && typedHistoryData.length > 0) {
        console.log('📊 Processando dados para gráficos:', typedHistoryData);
        
        setChartData({
          revenueData: typedHistoryData.map((month: MonthlyDashboardStats) => ({
            month: month.month_year,
            revenue: Number(month.monthly_revenue) || 0
          })).reverse(), // Ordenar cronologicamente
          
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
      } else {
        console.warn('⚠️ Dados de histórico não encontrados ou formato inválido');
        setChartData({
          revenueData: [],
          orderStatusData: [],
          userGrowthData: [],
          panelStatusData: [],
          last12Months: []
        });
      }
      
    } catch (err) {
      console.error('💥 Erro crítico ao buscar dados mensais:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMonthChange = useCallback((newMonth: string) => {
    console.log(`📅 Alterando mês selecionado para: ${newMonth}`);
    setSelectedMonth(newMonth);
    // Salvar no localStorage para persistir seleção
    localStorage.setItem('dashboard-selected-month', newMonth);
  }, []);

  // Carregar mês selecionado do localStorage na inicialização
  useEffect(() => {
    const savedMonth = localStorage.getItem('dashboard-selected-month');
    if (savedMonth && savedMonth !== selectedMonth) {
      console.log(`💾 Carregando mês salvo: ${savedMonth}`);
      setSelectedMonth(savedMonth);
    }
  }, []);

  // Buscar dados quando o mês selecionado muda
  useEffect(() => {
    console.log(`🔄 Recarregando dados para o mês: ${selectedMonth}`);
    fetchMonthlyStats(selectedMonth);
  }, [selectedMonth, fetchMonthlyStats]);

  const calculateGrowthPercentage = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getGrowthData = useCallback(() => {
    if (!comparison) return null;
    
    const growthData = {
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
    
    console.log('📈 Dados de crescimento calculados:', growthData);
    return growthData;
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
