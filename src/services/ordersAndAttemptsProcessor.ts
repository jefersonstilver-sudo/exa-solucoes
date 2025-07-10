
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

export const filterOrphanedAttempts = (tentativas: OrderOrAttempt[], pedidos: OrderOrAttempt[]): OrderOrAttempt[] => {
  // Criar mapa de pedidos pagos por client_id e valor para comparação rápida
  const paidOrdersMap = new Map<string, Set<number>>();
  
  pedidos
    .filter(p => ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'].includes(p.status))
    .forEach(pedido => {
      const clientId = pedido.client_id;
      const valor = pedido.valor_total;
      
      if (clientId && valor !== undefined) {
        if (!paidOrdersMap.has(clientId)) {
          paidOrdersMap.set(clientId, new Set());
        }
        paidOrdersMap.get(clientId)!.add(valor);
      }
    });
  
  // Filtrar tentativas que não têm pedido pago correspondente
  return tentativas.filter(tentativa => {
    const clientId = tentativa.client_id;
    const valor = tentativa.valor_total;
    
    if (!clientId || valor === undefined) return true;
    
    const clientOrders = paidOrdersMap.get(clientId);
    if (!clientOrders) return true;
    
    // Se existe pedido pago com mesmo valor para mesmo cliente, é tentativa órfã
    const isOrphaned = clientOrders.has(valor);
    
    if (isOrphaned) {
      console.log(`🚫 Tentativa órfã filtrada: ${tentativa.id} (Cliente: ${tentativa.client_email}, Valor: R$ ${valor})`);
    }
    
    return !isOrphaned;
  });
};

export const combineAndSortData = (pedidos: OrderOrAttempt[], tentativas: OrderOrAttempt[]): OrderOrAttempt[] => {
  // FILTRO EMERGENCIAL: Remover tentativas órfãs antes de combinar
  const tentativasLegitimas = filterOrphanedAttempts(tentativas, pedidos);
  
  console.log(`📊 Tentativas antes da filtragem: ${tentativas.length}`);
  console.log(`📊 Tentativas após filtragem: ${tentativasLegitimas.length}`);
  console.log(`🗑️ Tentativas órfãs removidas: ${tentativas.length - tentativasLegitimas.length}`);
  
  return [...pedidos, ...tentativasLegitimas]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const calculateStats = (pedidos: OrderOrAttempt[], tentativas: OrderOrAttempt[]): OrdersStats => {
  const totalOrders = pedidos.length;
  const totalAttempts = tentativas.length;
  const totalRevenue = pedidos
    .filter(p => ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'].includes(p.status))
    .reduce((sum, p) => sum + p.valor_total, 0);
  const abandonedValue = tentativas.reduce((sum, t) => sum + t.valor_total, 0);
  
  // Fórmula corrigida: conversões / total de interações * 100
  const totalInteractions = totalOrders + totalAttempts;
  const conversionRate = totalInteractions > 0 ? (totalOrders / totalInteractions) * 100 : 0;
  
  return {
    total_orders: totalOrders,
    total_attempts: totalAttempts,
    total_revenue: totalRevenue,
    conversion_rate: conversionRate,
    abandoned_value: abandonedValue
  };
};
