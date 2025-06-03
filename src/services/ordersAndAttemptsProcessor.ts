
import { OrderOrAttempt, OrdersStats } from '@/types/ordersAndAttempts';

export const formatOrdersData = (pedidosComEmails: any[]): OrderOrAttempt[] => {
  return pedidosComEmails.map(pedido => ({
    id: pedido.id,
    type: 'order' as const,
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
    video_status: pedido.video_status
  }));
};

export const formatAttemptsData = (tentativasComEmails: any[]): OrderOrAttempt[] => {
  return tentativasComEmails.map(tentativa => ({
    id: tentativa.id,
    type: 'attempt' as const,
    created_at: tentativa.created_at,
    status: 'tentativa',
    valor_total: tentativa.valor_total || 0,
    predios_selecionados: tentativa.predios_selecionados || [],
    client_email: tentativa.user_email,
    client_id: tentativa.id_user
  }));
};

export const combineAndSortData = (pedidos: OrderOrAttempt[], tentativas: OrderOrAttempt[]): OrderOrAttempt[] => {
  return [...pedidos, ...tentativas]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const calculateStats = (pedidos: OrderOrAttempt[], tentativas: OrderOrAttempt[]): OrdersStats => {
  const totalOrders = pedidos.length;
  const totalAttempts = tentativas.length;
  const totalRevenue = pedidos
    .filter(p => ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'].includes(p.status))
    .reduce((sum, p) => sum + p.valor_total, 0);
  const abandonedValue = tentativas.reduce((sum, t) => sum + t.valor_total, 0);
  
  // Corrigir fórmula da taxa de conversão: pedidos / tentativas * 100
  const conversionRate = totalAttempts > 0 ? (totalOrders / totalAttempts) * 100 : 0;
  
  return {
    total_orders: totalOrders,
    total_attempts: totalAttempts,
    total_revenue: totalRevenue,
    conversion_rate: conversionRate,
    abandoned_value: abandonedValue
  };
};
