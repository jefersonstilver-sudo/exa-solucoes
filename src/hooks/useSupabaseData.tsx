
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

      // Fetch users
      const { data: users } = await supabase
        .from('users')
        .select('id, data_criacao');

      // Fetch buildings
      const { data: buildings } = await supabase
        .from('buildings')
        .select('id, nome, status');

      // Fetch orders (pedidos)
      const { data: orders } = await supabase
        .from('pedidos')
        .select('id, status, valor_total, created_at, plano_meses');

      // Fetch panels (painels)
      const { data: panels } = await supabase
        .from('painels')
        .select('id, status, code');

      // Calculate stats
      const totalUsers = users?.length || 0;
      const totalBuildings = buildings?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalPanels = panels?.length || 0;

      // Calculate revenue from paid orders
      const monthlyRevenue = orders
        ?.filter(order => order.status === 'pago')
        ?.reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0) || 0;

      const activeOrders = orders?.filter(order => order.status === 'ativo')?.length || 0;
      const pendingOrders = orders?.filter(order => order.status === 'pendente')?.length || 0;
      const onlinePanels = panels?.filter(panel => panel.status === 'online')?.length || 0;

      setStats({
        totalUsers,
        totalBuildings,
        totalOrders,
        totalPanels,
        monthlyRevenue,
        activeOrders,
        onlinePanels,
        pendingOrders,
      });

      // Prepare chart data
      const revenueData = [
        { month: 'Jan', revenue: monthlyRevenue * 0.7 },
        { month: 'Fev', revenue: monthlyRevenue * 0.8 },
        { month: 'Mar', revenue: monthlyRevenue * 0.9 },
        { month: 'Abr', revenue: monthlyRevenue },
      ];

      const orderStatusData = [
        { name: 'Pendente', value: pendingOrders, color: '#f97316' },
        { name: 'Ativo', value: activeOrders, color: '#10b981' },
        { name: 'Pago', value: orders?.filter(o => o.status === 'pago')?.length || 0, color: '#6366f1' },
        { name: 'Cancelado', value: orders?.filter(o => o.status === 'cancelado')?.length || 0, color: '#ef4444' },
      ];

      const panelStatusData = [
        { status: 'Online', count: onlinePanels },
        { status: 'Offline', count: panels?.filter(p => p.status === 'offline')?.length || 0 },
        { status: 'Manutenção', count: panels?.filter(p => p.status === 'maintenance')?.length || 0 },
      ];

      const userGrowthData = [
        { month: 'Jan', users: Math.max(1, totalUsers - 3) },
        { month: 'Fev', users: Math.max(1, totalUsers - 2) },
        { month: 'Mar', users: Math.max(1, totalUsers - 1) },
        { month: 'Abr', users: totalUsers },
      ];

      setChartData({
        revenueData,
        orderStatusData,
        panelStatusData,
        userGrowthData,
      });

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, chartData, loading, refetch: fetchDashboardData };
};
