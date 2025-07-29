
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
  // Criar mapa mais robusto de pedidos pagos com múltiplos critérios
  const paidOrdersData = pedidos
    .filter(p => ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo'].includes(p.status))
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
  // Primeiro filtrar tentativas inválidas (valor zero ou muito baixo)
  const tentativasValidas = tentativas.filter(tentativa => {
    // Remover tentativas com valor muito baixo (provavelmente erros)
    if (tentativa.valor_total < 1) {
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
