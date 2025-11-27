import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadCount } from '@/modules/monitoramento-ia/hooks/useUnreadCount';

export interface DashboardMetrics {
  unreadConversations: number;
  panelsOnline: number;
  panelsTotal: number;
  todayRevenue: number;
  pendingOrders: number;
  panelsOffline: number;
  loading: boolean;
}

export const useDashboardMetrics = () => {
  const { unreadCount, loading: unreadLoading } = useUnreadCount();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    unreadConversations: 0,
    panelsOnline: 0,
    panelsTotal: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    panelsOffline: 0,
    loading: true
  });

  const fetchMetrics = async () => {
    try {
      // Buscar painéis
      const { data: panels, error: panelsError } = await supabase
        .from('painels')
        .select('status');

      if (panelsError) throw panelsError;

      const panelsOnline = panels?.filter(p => p.status === 'online').length || 0;
      const panelsTotal = panels?.length || 0;

      // Buscar receita de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayOrders, error: revenueError } = await supabase
        .from('pedidos')
        .select('valor_total')
        .eq('status', 'pago')
        .gte('created_at', today.toISOString());

      if (revenueError) throw revenueError;

      const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.valor_total || 0), 0) || 0;

      // Buscar pedidos pendentes
      const { count: pendingCount, error: pendingError } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pendente', 'pago_pendente_video']);

      if (pendingError) throw pendingError;

      setMetrics({
        unreadConversations: unreadCount,
        panelsOnline,
        panelsTotal,
        todayRevenue,
        pendingOrders: pendingCount || 0,
        panelsOffline: panelsTotal - panelsOnline,
        loading: false
      });
    } catch (error) {
      console.error('[useDashboardMetrics] Error:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Realtime para painéis
    const panelsChannel = supabase
      .channel('panels_status_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'painels'
      }, () => {
        fetchMetrics();
      })
      .subscribe();

    // Realtime para pedidos
    const ordersChannel = supabase
      .channel('orders_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pedidos'
      }, () => {
        fetchMetrics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(panelsChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [unreadCount]);

  return metrics;
};
