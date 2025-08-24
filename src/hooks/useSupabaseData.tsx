
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalUsers: number;
  totalBuildings: number;
  totalOrders: number;
  totalPanels: number;
  monthlyRevenue: number;
  activeOrders: number;
  onlinePanels: number;
  pendingOrders: number;
}

export interface ChartData {
  revenueData: Array<{ month: string; revenue: number }>;
  orderStatusData: Array<{ name: string; value: number; color: string }>;
  panelStatusData: Array<{ status: string; count: number }>;
  userGrowthData: Array<{ month: string; users: number }>;
}

interface DashboardStatsResponse {
  total_users: number;
  total_buildings: number;
  total_orders: number;
  total_panels: number;
  monthly_revenue: number;
  active_orders: number;
  pending_orders: number;
  online_panels: number;
}

export const useSupabaseData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBuildings: 0,
    totalOrders: 0,
    totalPanels: 0,
    monthlyRevenue: 0,
    activeOrders: 0,
    onlinePanels: 0,
    pendingOrders: 0,
  });

  const [chartData, setChartData] = useState<ChartData>({
    revenueData: [],
    orderStatusData: [],
    panelStatusData: [],
    userGrowthData: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Buscando dados do dashboard...');

      const { data: dashboardStats, error: statsError } = await supabase
        .rpc('get_dashboard_stats');

      if (statsError) {
        console.error('❌ Erro na função get_dashboard_stats:', statsError);
        await fetchDataIndividually();
        return;
      }

      if (dashboardStats) {
        console.log('📊 Dados recebidos do dashboard:', dashboardStats);
        const typedStats = dashboardStats as unknown as DashboardStatsResponse;
        
        const stats = {
          totalUsers: typedStats.total_users || 0,
          totalBuildings: typedStats.total_buildings || 0,
          totalOrders: typedStats.total_orders || 0,
          totalPanels: typedStats.total_panels || 0,
          monthlyRevenue: Number(typedStats.monthly_revenue) || 0,
          activeOrders: typedStats.active_orders || 0,
          onlinePanels: typedStats.online_panels || 0,
          pendingOrders: typedStats.pending_orders || 0,
        };

        console.log('💰 Receita mensal calculada:', stats.monthlyRevenue);
        setStats(stats);
        await generateRealChartData(stats);
      } else {
        await fetchDataIndividually();
      }

    } catch (error) {
      console.error('💥 Erro crítico no dashboard:', error);
      await fetchDataIndividually();
    } finally {
      setLoading(false);
    }
  };

  const fetchDataIndividually = async () => {
    try {
      console.log('🔄 Buscando dados individualmente...');
      const [usersResult, buildingsResult, ordersResult, panelsResult] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('buildings').select('*'),
        supabase.from('pedidos').select('*'),
        supabase.from('painels').select('*')
      ]);

      const users = usersResult.data || [];
      const buildings = buildingsResult.data || [];
      const orders = ordersResult.data || [];
      const panels = panelsResult.data || [];

      // Usar os mesmos status que as funções SQL corrigidas
      const paidOrders = orders.filter(order => 
        ['pago', 'pago_pendente_video', 'video_aprovado'].includes(order.status)
      );
      
      const monthlyRevenue = paidOrders.reduce((sum, order) => {
        return sum + (Number(order.valor_total) || 0);
      }, 0);

      console.log('💰 Receita calculada individualmente:', monthlyRevenue);

      const stats = {
        totalUsers: users.length,
        totalBuildings: buildings.length,
        totalOrders: orders.length,
        totalPanels: panels.length,
        monthlyRevenue,
        activeOrders: orders.filter(o => o.status === 'video_aprovado').length,
        pendingOrders: orders.filter(o => ['pendente', 'pago_pendente_video'].includes(o.status)).length,
        onlinePanels: panels.filter(p => p.status === 'online').length,
      };

      setStats(stats);
      await generateRealChartData(stats);

    } catch (error) {
      console.error('❌ Erro no fallback:', error);
    }
  };

  const generateRealChartData = async (stats: DashboardStats) => {
    try {
      console.log('📊 Gerando dados para gráficos...');
      // Buscar dados reais com datas
      const [ordersResult, panelsResult, usersResult] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at'),
        supabase.from('painels').select('*'),
        supabase.from('users').select('*').order('data_criacao')
      ]);

      const orders = ordersResult.data || [];
      const panels = panelsResult.data || [];
      const users = usersResult.data || [];

      // Receita baseada em dados reais (incluindo status 'ativo')
      const paidOrders = orders.filter(o => 
        ['pago', 'pago_pendente_video', 'video_aprovado'].includes(o.status)
      );
      
      const revenueData = paidOrders.length > 0 ? [
        { 
          month: 'Total Real', 
          revenue: paidOrders.reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0)
        }
      ] : [];

      // Status dos pedidos baseado em dados reais com status corretos
      const pendingCount = orders.filter(o => ['pendente', 'pago_pendente_video'].includes(o.status)).length;
      const activeCount = orders.filter(o => o.status === 'video_aprovado').length;
      const paidCount = orders.filter(o => o.status === 'pago').length;
      const canceledCount = orders.filter(o => o.status === 'cancelado').length;
      
      const orderStatusData = [
        { name: 'Pendente', value: pendingCount, color: '#f97316' },
        { name: 'Ativo', value: activeCount, color: '#10b981' },
        { name: 'Pago', value: paidCount, color: '#6366f1' },
        { name: 'Cancelado', value: canceledCount, color: '#ef4444' },
      ].filter(item => item.value > 0);

      // Status dos painéis baseado em dados reais
      const onlineCount = panels.filter(p => p.status === 'online').length;
      const offlineCount = panels.filter(p => p.status === 'offline').length;
      const maintenanceCount = panels.filter(p => p.status === 'maintenance').length;
      
      const panelStatusData = [
        { status: 'Online', count: onlineCount },
        { status: 'Offline', count: offlineCount },
        { status: 'Manutenção', count: maintenanceCount },
      ].filter(item => item.count > 0);

      // Crescimento de usuários baseado em dados reais
      const userGrowthData = users.length > 0 ? [
        { month: 'Total Atual', users: users.length }
      ] : [];

      console.log('📈 Dados de gráficos gerados:', {
        revenueData,
        orderStatusData,
        panelStatusData,
        userGrowthData
      });

      setChartData({
        revenueData,
        orderStatusData,
        panelStatusData,
        userGrowthData,
      });

    } catch (error) {
      console.error('❌ Erro ao gerar gráficos com dados reais:', error);
      setChartData({
        revenueData: [],
        orderStatusData: [],
        panelStatusData: [],
        userGrowthData: [],
      });
    }
  };

  return { stats, chartData, loading, refetch: fetchDashboardData };
};
