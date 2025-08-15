// Utilitário para testar e detectar pagamentos duplicados

import { supabase } from '@/integrations/supabase/client';

export interface DuplicatePaymentReport {
  duplicatedOrders: Array<{
    userId: string;
    userEmail: string;
    totalValue: number;
    orderCount: number;
    orderIds: string[];
    createdDates: string[];
    statuses: string[];
  }>;
  totalAffectedOrders: number;
  totalAffectedUsers: number;
  estimatedLoss: number;
}

/**
 * Detecta pedidos duplicados por usuário e valor
 */
export async function detectDuplicatePayments(): Promise<DuplicatePaymentReport> {
  try {
    console.log('🔍 Analisando pagamentos duplicados...');

    // Buscar pedidos pagos agrupados por usuário e valor
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        client_id,
        valor_total,
        status,
        created_at,
        source_tentativa_id,
        transaction_id
      `)
      .in('status', ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar pedidos: ${error.message}`);
    }

    // Buscar emails dos usuários
    const userIds = [...new Set(pedidos.map(p => p.client_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    if (usersError) {
      console.warn('Aviso: não foi possível buscar emails dos usuários');
    }

    const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || []);

    // Agrupar por usuário e valor
    const groupedPayments = new Map<string, typeof pedidos>();
    
    pedidos.forEach(pedido => {
      const key = `${pedido.client_id}-${pedido.valor_total}`;
      if (!groupedPayments.has(key)) {
        groupedPayments.set(key, []);
      }
      groupedPayments.get(key)!.push(pedido);
    });

    // Identificar duplicatas
    const duplicatedOrders: DuplicatePaymentReport['duplicatedOrders'] = [];
    let totalAffectedOrders = 0;
    let estimatedLoss = 0;

    groupedPayments.forEach((orders, key) => {
      if (orders.length > 1) {
        const [userId, valor] = key.split('-');
        const userEmail = userEmailMap.get(userId) || 'email-não-encontrado';
        const totalValue = parseFloat(valor);

        duplicatedOrders.push({
          userId,
          userEmail,
          totalValue,
          orderCount: orders.length,
          orderIds: orders.map(o => o.id),
          createdDates: orders.map(o => o.created_at),
          statuses: orders.map(o => o.status)
        });

        // Calcular perda estimada (pagou 1, recebeu N)
        totalAffectedOrders += orders.length;
        estimatedLoss += totalValue * (orders.length - 1);
      }
    });

    const report: DuplicatePaymentReport = {
      duplicatedOrders,
      totalAffectedOrders,
      totalAffectedUsers: duplicatedOrders.length,
      estimatedLoss
    };

    console.log('📊 Relatório de duplicatas gerado:', {
      totalDuplicates: duplicatedOrders.length,
      totalAffectedOrders,
      estimatedLoss: `R$ ${estimatedLoss.toFixed(2)}`
    });

    return report;

  } catch (error: any) {
    console.error('❌ Erro ao detectar duplicatas:', error);
    throw new Error(`Falha na análise: ${error.message}`);
  }
}

/**
 * Corrige pedidos duplicados - marca todos exceto o primeiro como cancelados
 */
export async function fixDuplicatePayments(report: DuplicatePaymentReport) {
  try {
    console.log('🔧 Iniciando correção de duplicatas...');

    let correctedCount = 0;
    let errorsCount = 0;

    for (const duplicate of report.duplicatedOrders) {
      try {
        // Manter apenas o primeiro pedido (mais antigo), cancelar os outros
        const ordersToCancel = duplicate.orderIds.slice(1);
        
        console.log(`Corrigindo usuário ${duplicate.userEmail}: mantendo ${duplicate.orderIds[0]}, cancelando ${ordersToCancel.length} pedidos`);

        for (const orderId of ordersToCancel) {
          const { error } = await supabase
            .from('pedidos')
            .update({
              status: 'cancelado_automaticamente',
              log_pagamento: {
                cancelled_reason: 'Pedido duplicado detectado - mantido apenas o primeiro',
                cancelled_at: new Date().toISOString(),
                original_status: duplicate.statuses[duplicate.orderIds.indexOf(orderId)],
                duplicate_detection_timestamp: new Date().toISOString()
              }
            })
            .eq('id', orderId);

          if (error) {
            console.error(`❌ Erro ao cancelar pedido ${orderId}:`, error);
            errorsCount++;
          } else {
            correctedCount++;
          }
        }

        // Log da correção
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'DUPLICATE_PAYMENT_CORRECTION',
            descricao: `Correção de duplicatas: usuário ${duplicate.userEmail}, valor R$${duplicate.totalValue}, ${ordersToCancel.length} pedidos cancelados, mantido pedido ${duplicate.orderIds[0]}`
          });

      } catch (error: any) {
        console.error(`❌ Erro ao processar duplicata do usuário ${duplicate.userEmail}:`, error);
        errorsCount++;
      }
    }

    console.log(`✅ Correção finalizada: ${correctedCount} pedidos cancelados, ${errorsCount} erros`);

    return {
      success: true,
      correctedCount,
      errorsCount,
      message: `${correctedCount} pedidos duplicados cancelados com ${errorsCount} erros`
    };

  } catch (error: any) {
    console.error('❌ Erro na correção de duplicatas:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gera relatório em texto para auditoria
 */
export function generateAuditReport(report: DuplicatePaymentReport): string {
  const lines = [
    '=== RELATÓRIO DE PAGAMENTOS DUPLICADOS ===',
    `Data/Hora: ${new Date().toLocaleString('pt-BR')}`,
    '',
    `Total de usuários afetados: ${report.totalAffectedUsers}`,
    `Total de pedidos duplicados: ${report.totalAffectedOrders}`,
    `Perda estimada: R$ ${report.estimatedLoss.toFixed(2)}`,
    '',
    '=== DETALHES POR USUÁRIO ===',
    ''
  ];

  report.duplicatedOrders.forEach((duplicate, index) => {
    lines.push(`${index + 1}. Usuário: ${duplicate.userEmail}`);
    lines.push(`   Valor: R$ ${duplicate.totalValue.toFixed(2)}`);
    lines.push(`   Pedidos: ${duplicate.orderCount}`);
    lines.push(`   IDs: ${duplicate.orderIds.join(', ')}`);
    lines.push(`   Status: ${duplicate.statuses.join(', ')}`);
    lines.push(`   Datas: ${duplicate.createdDates.map(d => new Date(d).toLocaleString('pt-BR')).join(', ')}`);
    lines.push('');
  });

  return lines.join('\n');
}