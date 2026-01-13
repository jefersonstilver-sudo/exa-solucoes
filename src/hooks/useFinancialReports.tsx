import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  activeOrders: number;
  pendingBenefits: number;
  activeClients: number;
  averageOrderValue: number;
  conversionRate: number;
  churnRate: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  orders: number;
}

export interface TopClient {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  ordersCount: number;
}

export function useFinancialReports(startDate?: Date, endDate?: Date) {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeOrders: 0,
    pendingBenefits: 0,
    activeClients: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    churnRate: 0,
  });
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate?.getTime(), endDate?.getTime()]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Log financial access
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('financial_access_logs').insert([{
          user_id: user.id,
          resource_type: 'report',
          action: 'view',
          data_accessed: { 
            start_date: startDate?.toISOString(), 
            end_date: endDate?.toISOString() 
          },
        }]);
      }

      // Buscar pedidos pagos
      let ordersQuery = supabase
        .from('pedidos')
        .select('*')
        .in('status', ['aguardando_contrato', 'aguardando_video', 'video_enviado', 'video_aprovado', 'ativo']);

      if (startDate) {
        ordersQuery = ordersQuery.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        ordersQuery = ordersQuery.lte('created_at', endDate.toISOString());
      }

      const { data: orders } = await ordersQuery;

      // Calcular métricas
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.valor_total || 0), 0) || 0;
      const activeOrders = orders?.filter(o => {
        if (!o.data_fim) return false;
        return new Date(o.data_fim) > new Date();
      }).length || 0;

      // Receita do mês atual
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);

      const monthlyRevenue = orders?.filter(o => 
        new Date(o.created_at) >= currentMonthStart
      ).reduce((sum, o) => sum + (o.valor_total || 0), 0) || 0;

      // Benefícios pendentes
      const { data: benefits } = await supabase
        .from('provider_benefits')
        .select('id')
        .is('gift_code', null);

      // Clientes ativos (com pedidos ativos)
      const activeClientIds = new Set(
        orders?.filter(o => {
          if (!o.data_fim) return false;
          return new Date(o.data_fim) > new Date();
        }).map(o => o.client_id)
      );

      // Receita por mês
      const revenueMap = new Map<string, { revenue: number; orders: number }>();
      orders?.forEach(order => {
        const date = new Date(order.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = revenueMap.get(monthKey) || { revenue: 0, orders: 0 };
        revenueMap.set(monthKey, {
          revenue: existing.revenue + (order.valor_total || 0),
          orders: existing.orders + 1,
        });
      });

      const revenueByMonthData = Array.from(revenueMap.entries())
        .map(([month, data]) => ({
          month,
          revenue: data.revenue,
          orders: data.orders,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Top clientes
      const clientSpending = new Map<string, { name: string; email: string; spent: number; orders: number }>();
      
      for (const order of orders || []) {
        const existing = clientSpending.get(order.client_id) || {
          name: '',
          email: order.email || '',
          spent: 0,
          orders: 0,
        };

        clientSpending.set(order.client_id, {
          ...existing,
          spent: existing.spent + (order.valor_total || 0),
          orders: existing.orders + 1,
        });
      }

      // Buscar nomes dos clientes
      const topClientsData = await Promise.all(
        Array.from(clientSpending.entries())
          .sort(([, a], [, b]) => b.spent - a.spent)
          .slice(0, 10)
          .map(async ([id, data]) => {
            const { data: user } = await supabase
              .from('users')
              .select('nome, email')
              .eq('id', id)
              .single();

            return {
              id,
              name: user?.nome || data.email,
              email: user?.email || data.email,
              totalSpent: data.spent,
              ordersCount: data.orders,
            };
          })
      );

      setMetrics({
        totalRevenue,
        monthlyRevenue,
        activeOrders,
        pendingBenefits: benefits?.length || 0,
        activeClients: activeClientIds.size,
        averageOrderValue: orders && orders.length > 0 ? totalRevenue / orders.length : 0,
        conversionRate: 0, // TODO: Calculate from attempts vs orders
        churnRate: 0, // TODO: Calculate from expired orders
      });

      setRevenueByMonth(revenueByMonthData);
      setTopClients(topClientsData);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    metrics,
    revenueByMonth,
    topClients,
    loading,
    refetch: fetchFinancialData,
  };
}
