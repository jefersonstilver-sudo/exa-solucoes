
import { OrderOrAttempt, OrdersStats } from '@/types/ordersAndAttempts';

export const formatOrdersData = (pedidosComEmails: any[]): OrderOrAttempt[] => {
  return pedidosComEmails.map(pedido => ({
    id: pedido.id,
    type: pedido.status === 'tentativa' ? 'attempt' : 'order',
    created_at: pedido.created_at,
    status: pedido.status,
    valor_total: pedido.valor_total || 0,
    lista_paineis: pedido.lista_paineis || [],
    plano_meses: pedido.plano_meses,
    data_inicio: pedido.data_inicio,
    data_fim: pedido.data_fim,
    client_id: pedido.client_id,
    client_email: pedido.client_email,
    client_name: pedido.client_name,
    video_status: pedido.video_status,
    email: pedido.email
  }));
};

export const combineAndSortData = (pedidos: OrderOrAttempt[]): OrderOrAttempt[] => {
  return pedidos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const calculateStats = (pedidos: OrderOrAttempt[]): OrdersStats => {
  const orders = pedidos.filter(p => p.type === 'order');
  const attempts = pedidos.filter(p => p.type === 'attempt');
  
  const totalOrders = orders.length;
  const totalAttempts = attempts.length;
  const totalRevenue = orders
    .filter(p => ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'].includes(p.status))
    .reduce((sum, p) => sum + p.valor_total, 0);
  const abandonedValue = attempts.reduce((sum, t) => sum + t.valor_total, 0);
  
  const conversionRate = totalAttempts > 0 ? (totalOrders / totalAttempts) * 100 : 0;
  
  return {
    total_orders: totalOrders,
    total_attempts: totalAttempts,
    total_revenue: totalRevenue,
    conversion_rate: conversionRate,
    abandoned_value: abandonedValue
  };
};
