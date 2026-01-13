import { useState, useEffect, useCallback } from 'react';
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
  isRealtimeConnected: boolean;
  lastUpdate: Date | null;
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
    loading: true,
    isRealtimeConnected: false,
    lastUpdate: null
  });

  const fetchMetrics = useCallback(async () => {
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
        .in('status', ['pendente', 'aguardando_contrato']);

      if (pendingError) throw pendingError;

      setMetrics(prev => ({
        unreadConversations: unreadCount,
        panelsOnline,
        panelsTotal,
        todayRevenue,
        pendingOrders: pendingCount || 0,
        panelsOffline: panelsTotal - panelsOnline,
        loading: false,
        isRealtimeConnected: prev.isRealtimeConnected,
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.error('[useDashboardMetrics] Error:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  }, [unreadCount]);

  useEffect(() => {
    fetchMetrics();

    // Realtime para painéis com status de conexão
    const panelsChannel = supabase
      .channel('panels_status_updates_v2')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'painels'
      }, (payload) => {
        console.log('[useDashboardMetrics] Panel change detected:', payload);
        fetchMetrics();
      })
      .subscribe((status) => {
        console.log('[useDashboardMetrics] Panels channel status:', status);
        setMetrics(prev => ({
          ...prev,
          isRealtimeConnected: status === 'SUBSCRIBED'
        }));
      });

    // Realtime para pedidos
    const ordersChannel = supabase
      .channel('orders_updates_v2')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pedidos'
      }, () => {
        fetchMetrics();
      })
      .subscribe();

    // Heartbeat para verificar conexão a cada 30s
    const heartbeat = setInterval(() => {
      setMetrics(prev => ({ ...prev, lastUpdate: new Date() }));
    }, 30000);

    return () => {
      supabase.removeChannel(panelsChannel);
      supabase.removeChannel(ordersChannel);
      clearInterval(heartbeat);
    };
  }, [fetchMetrics]);

  return metrics;
};
