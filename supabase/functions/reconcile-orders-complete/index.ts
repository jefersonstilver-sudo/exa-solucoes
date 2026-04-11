/**
 * Edge Function: reconcile-orders-complete
 * 
 * Faz auditoria e reconciliação completa de pedidos e parcelas
 * com base nos pagamentos confirmados no ASAAS
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconciliationResult {
  success: boolean;
  timestamp: string;
  summary: {
    pedidosCorrigidos: number;
    parcelasCorrigidas: number;
    erros: number;
    pagamentosAsaas: number;
    pedidosPendentesAntes: number;
  };
  detalhes: {
    pedidos: Array<{
      id: string;
      statusAnterior: string;
      statusNovo: string;
      motivo: string;
    }>;
    parcelas: Array<{
      id: string;
      pedidoId: string;
      numeroParcela: number;
      statusAnterior: string;
      statusNovo: string;
    }>;
    erros: Array<{
      tipo: string;
      mensagem: string;
      dados?: any;
    }>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 [RECONCILE] Iniciando reconciliação completa de pedidos...');

    const result: ReconciliationResult = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        pedidosCorrigidos: 0,
        parcelasCorrigidas: 0,
        erros: 0,
        pagamentosAsaas: 0,
        pedidosPendentesAntes: 0
      },
      detalhes: {
        pedidos: [],
        parcelas: [],
        erros: []
      }
    };

    // 1. Buscar pedidos pendentes
    const { data: pedidosPendentes, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, status, client_id, valor_total, created_at')
      .eq('status', 'pendente');

    if (pedidosError) {
      throw new Error(`Erro ao buscar pedidos pendentes: ${pedidosError.message}`);
    }

    result.summary.pedidosPendentesAntes = pedidosPendentes?.length || 0;
    console.log(`📊 [RECONCILE] Pedidos pendentes encontrados: ${result.summary.pedidosPendentesAntes}`);

    // 2. Buscar transações ASAAS confirmadas
    const { data: transacoesAsaas, error: transacoesError } = await supabase
      .from('transacoes_asaas')
      .select('*')
      .eq('status', 'RECEIVED');

    if (transacoesError) {
      throw new Error(`Erro ao buscar transações ASAAS: ${transacoesError.message}`);
    }

    result.summary.pagamentosAsaas = transacoesAsaas?.length || 0;
    console.log(`💰 [RECONCILE] Transações ASAAS confirmadas: ${result.summary.pagamentosAsaas}`);

    // 3. Para cada transação ASAAS, verificar se está sincronizada
    for (const transacao of transacoesAsaas || []) {
      try {
        const externalRef = transacao.external_reference;
        if (!externalRef) continue;

        // Verificar se é um pedido_id
        const { data: pedido } = await supabase
          .from('pedidos')
          .select('id, status, client_id')
          .eq('id', externalRef)
          .maybeSingle();

        if (pedido) {
          // É um pedido - verificar se precisa atualizar
          if (pedido.status === 'pendente') {
            const { error: updateError } = await supabase
              .from('pedidos')
              .update({
                status: 'aguardando_contrato',
                transaction_id: transacao.asaas_id,
                log_pagamento: {
                  provider: 'asaas',
                  payment_id: transacao.asaas_id,
                  payment_status: 'approved',
                  payment_date: transacao.data_pagamento || new Date().toISOString(),
                  value: transacao.valor,
                  reconciled_at: new Date().toISOString(),
                  reconciled_by: 'reconcile-orders-complete'
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', pedido.id);

            if (!updateError) {
              result.summary.pedidosCorrigidos++;
              result.detalhes.pedidos.push({
                id: pedido.id,
                statusAnterior: 'pendente',
                statusNovo: 'aguardando_contrato',
                motivo: `Pagamento ASAAS ${transacao.asaas_id} encontrado`
              });
              console.log(`✅ [RECONCILE] Pedido ${pedido.id} corrigido para aguardando_contrato`);
            } else {
              result.detalhes.erros.push({
                tipo: 'update_pedido',
                mensagem: updateError.message,
                dados: { pedidoId: pedido.id }
              });
              result.summary.erros++;
            }
          }
          continue;
        }

        // Verificar se é uma parcela_id
        const { data: parcela } = await supabase
          .from('parcelas')
          .select('id, pedido_id, numero_parcela, status, valor_final')
          .eq('id', externalRef)
          .maybeSingle();

        if (parcela) {
          // É uma parcela - atualizar se pendente
          if (['pendente', 'aguardando_pagamento', 'atrasado'].includes(parcela.status)) {
            const { error: parcelaUpdateError } = await supabase
              .from('parcelas')
              .update({
                status: 'pago',
                data_pagamento: transacao.data_pagamento || new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', parcela.id);

            if (!parcelaUpdateError) {
              result.summary.parcelasCorrigidas++;
              result.detalhes.parcelas.push({
                id: parcela.id,
                pedidoId: parcela.pedido_id,
                numeroParcela: parcela.numero_parcela,
                statusAnterior: parcela.status,
                statusNovo: 'pago'
              });
              console.log(`✅ [RECONCILE] Parcela ${parcela.id} corrigida para pago`);

              // Se é a primeira parcela, atualizar o pedido
              if (parcela.numero_parcela === 1) {
                const { data: pedidoParcela } = await supabase
                  .from('pedidos')
                  .select('id, status')
                  .eq('id', parcela.pedido_id)
                  .maybeSingle();

                if (pedidoParcela && pedidoParcela.status === 'pendente') {
                  await supabase
                    .from('pedidos')
                    .update({
                      status: 'aguardando_contrato',
                      transaction_id: transacao.asaas_id,
                      log_pagamento: {
                        provider: 'asaas',
                        payment_id: transacao.asaas_id,
                        payment_status: 'approved',
                        payment_date: transacao.data_pagamento || new Date().toISOString(),
                        value: transacao.valor,
                        parcela_numero: 1,
                        reconciled_at: new Date().toISOString(),
                        reconciled_by: 'reconcile-orders-complete'
                      },
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', parcela.pedido_id);

                  result.summary.pedidosCorrigidos++;
                  result.detalhes.pedidos.push({
                    id: parcela.pedido_id,
                    statusAnterior: 'pendente',
                    statusNovo: 'aguardando_contrato',
                    motivo: `Primeira parcela ${parcela.id} paga`
                  });
                  console.log(`✅ [RECONCILE] Pedido ${parcela.pedido_id} corrigido via parcela`);
                }
              }
            } else {
              result.detalhes.erros.push({
                tipo: 'update_parcela',
                mensagem: parcelaUpdateError.message,
                dados: { parcelaId: parcela.id }
              });
              result.summary.erros++;
            }
          }
        }
      } catch (itemError: any) {
        result.detalhes.erros.push({
          tipo: 'processing',
          mensagem: itemError.message,
          dados: { transacaoId: transacao.id }
        });
        result.summary.erros++;
      }
    }

    // 4. Verificar webhook_logs não processados
    const { data: webhooksNaoProcessados } = await supabase
      .from('webhook_logs')
      .select('id, webhook_id, event_type, payload, created_at')
      .eq('provider', 'asaas')
      .in('event_type', ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'])
      .neq('status', 'processed')
      .order('created_at', { ascending: false })
      .limit(50);

    for (const webhook of webhooksNaoProcessados || []) {
      try {
        const payload = webhook.payload as any;
        const payment = payload?.payment;
        if (!payment?.externalReference) continue;

        const externalRef = payment.externalReference;

        // Tentar encontrar como parcela
        const { data: parcela } = await supabase
          .from('parcelas')
          .select('id, pedido_id, numero_parcela, status')
          .eq('id', externalRef)
          .maybeSingle();

        if (parcela && ['pendente', 'aguardando_pagamento', 'atrasado'].includes(parcela.status)) {
          await supabase
            .from('parcelas')
            .update({
              status: 'pago',
              data_pagamento: payment.paymentDate || payment.confirmedDate || new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', parcela.id);

          result.summary.parcelasCorrigidas++;
          result.detalhes.parcelas.push({
            id: parcela.id,
            pedidoId: parcela.pedido_id,
            numeroParcela: parcela.numero_parcela,
            statusAnterior: parcela.status,
            statusNovo: 'pago'
          });

          // Atualizar webhook como processado
          await supabase
            .from('webhook_logs')
            .update({ status: 'processed', processed_at: new Date().toISOString() })
            .eq('id', webhook.id);

          // Se primeira parcela, atualizar pedido
          if (parcela.numero_parcela === 1) {
            const { data: pedido } = await supabase
              .from('pedidos')
              .select('id, status')
              .eq('id', parcela.pedido_id)
              .maybeSingle();

            if (pedido && pedido.status === 'pendente') {
              await supabase
                .from('pedidos')
                .update({
                  status: 'aguardando_contrato',
                  transaction_id: payment.id,
                  updated_at: new Date().toISOString()
                })
                .eq('id', parcela.pedido_id);

              result.summary.pedidosCorrigidos++;
              result.detalhes.pedidos.push({
                id: parcela.pedido_id,
                statusAnterior: 'pendente',
                statusNovo: 'aguardando_contrato',
                motivo: `Webhook ${webhook.id} reprocessado`
              });
            }
          }
        }
      } catch (webhookError: any) {
        result.detalhes.erros.push({
          tipo: 'webhook_reprocess',
          mensagem: webhookError.message,
          dados: { webhookId: webhook.id }
        });
        result.summary.erros++;
      }
    }

    // 5. Registrar log do evento de reconciliação
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'ORDERS_RECONCILIATION_COMPLETE',
        descricao: `Reconciliação concluída: ${result.summary.pedidosCorrigidos} pedidos, ${result.summary.parcelasCorrigidas} parcelas`,
        metadata: result
      });

    console.log('✅ [RECONCILE] Reconciliação concluída:', result.summary);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [RECONCILE] Erro na reconciliação:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
