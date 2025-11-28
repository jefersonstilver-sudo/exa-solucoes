
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
    video_status: pedido.video_status,
    coupon_code: pedido.coupon_code,
    coupon_category: pedido.coupon_category
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
  // Status que indicam pagamento confirmado
  const PAID_STATUSES = ['ativo', 'pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado'];
  
  // Criar mapa mais robusto de pedidos pagos com múltiplos critérios
  const paidOrdersData = pedidos
    .filter(p => PAID_STATUSES.includes(p.status))
    .map(pedido => ({
      client_id: pedido.client_id,
      valor_total: pedido.valor_total,
      created_at: new Date(pedido.created_at),
      id: pedido.id
    }));
  
  // Filtrar tentativas que já resultaram em pedidos pagos
  return tentativas.filter(tentativa => {
    const tentativaClientId = tentativa.client_id;
    const tentativaValor = tentativa.valor_total;
    const tentativaData = new Date(tentativa.created_at);
    
    if (!tentativaClientId || tentativaValor === undefined) return true;
    
    // Verificar se existe pedido pago correspondente
    const hasMatchingOrder = paidOrdersData.some(pedido => {
      // Mesmo cliente e mesmo valor
      if (pedido.client_id !== tentativaClientId || pedido.valor_total !== tentativaValor) {
        return false;
      }
      
      // Verificar proximidade de data (máximo 24 horas de diferença)
      const timeDiff = Math.abs(pedido.created_at.getTime() - tentativaData.getTime());
      const maxTimeDiff = 24 * 60 * 60 * 1000; // 24 horas em milliseconds
      
      return timeDiff <= maxTimeDiff;
    });
    
    if (hasMatchingOrder) {
      console.log(`🚫 Tentativa órfã filtrada: ${tentativa.id} (Cliente: ${tentativa.client_email}, Valor: R$ ${tentativaValor})`);
      return false;
    }
    
    return true;
  });
};

export const combineAndSortData = (pedidos: OrderOrAttempt[], tentativas: OrderOrAttempt[]): OrderOrAttempt[] => {
  // Filtrar apenas tentativas com valor <= 0 (claramente inválidas)
  const tentativasValidas = tentativas.filter(tentativa => {
    // Manter tentativas com valor > 0, incluindo R$ 0,05 e similares
    if (tentativa.valor_total <= 0) {
      console.log(`🚫 Tentativa com valor inválido removida: ${tentativa.id} (Valor: R$ ${tentativa.valor_total})`);
      return false;
    }
    return true;
  });
  
  // FILTRO EMERGENCIAL: Remover tentativas órfãs antes de combinar
  const tentativasLegitimas = filterOrphanedAttempts(tentativasValidas, pedidos);
  
  console.log(`📊 Tentativas antes da filtragem: ${tentativas.length}`);
  console.log(`📊 Tentativas válidas (valor > R$ 1): ${tentativasValidas.length}`);
  console.log(`📊 Tentativas após filtragem de órfãs: ${tentativasLegitimas.length}`);
  console.log(`🗑️ Total de tentativas removidas: ${tentativas.length - tentativasLegitimas.length}`);
  
  return [...pedidos, ...tentativasLegitimas]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const calculateStats = (pedidos: OrderOrAttempt[], tentativas: OrderOrAttempt[]): OrdersStats => {
  // Status que indicam pagamento confirmado
  const PAID_STATUSES = ['ativo', 'pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado'];
  
  // Pedidos pagos = status "ativo" ou equivalentes
  const paidOrders = pedidos.filter(p => PAID_STATUSES.includes(p.status));
  
  // Pedidos não pagos = "pendente", "cancelado", etc.
  const unpaidOrders = pedidos.filter(p => !PAID_STATUSES.includes(p.status));
  
  const totalOrders = pedidos.length;
  const totalPaidOrders = paidOrders.length;
  
  // Tentativas = tentativas_compra + pedidos não pagos
  const totalAttempts = tentativas.length + unpaidOrders.length;
  
  // Receita real: APENAS pedidos com status "pago"
  const totalRevenue = paidOrders.reduce((sum, p) => sum + (p.valor_total || 0), 0);
  
  // Valor abandonado: tentativas + pedidos não pagos
  const abandonedValue = tentativas.reduce((sum, t) => sum + (t.valor_total || 0), 0) +
                         unpaidOrders.reduce((sum, p) => sum + (p.valor_total || 0), 0);
  
  // Taxa de conversão: pedidos pagos / (pedidos pagos + tentativas + pedidos não pagos) * 100
  const totalInteractions = totalPaidOrders + tentativas.length + unpaidOrders.length;
  const conversionRate = totalInteractions > 0 
    ? Number(((totalPaidOrders / totalInteractions) * 100).toFixed(1))
    : 0;
  
  console.log('📊 Stats calculados:', {
    totalOrders,
    totalPaidOrders,
    totalAttempts,
    totalRevenue: totalRevenue.toFixed(2),
    conversionRate: `${conversionRate}%`,
    abandonedValue: abandonedValue.toFixed(2)
  });
  
  return {
    total_orders: totalOrders,
    total_attempts: totalAttempts,
    total_revenue: totalRevenue,
    conversion_rate: conversionRate,
    abandoned_value: abandonedValue
  };
};
