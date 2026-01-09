/**
 * Edge Function: sync-inter-extrato
 * 
 * Sincroniza extrato bancário do Banco Inter
 * Cruza com cobrancas/parcelas pendentes para conciliação automática
 * 
 * Esta é a FONTE DA VERDADE para pagamentos confirmados
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getInterExtrato, InterExtratoItem } from "../_shared/inter-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconciliationResult {
  matched: number;
  unmatched: number;
  errors: number;
  details: Array<{
    transacao: string;
    valor: number;
    status: 'matched' | 'unmatched' | 'error';
    parcelaId?: string;
    pedidoId?: string;
    message?: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 [sync-inter-extrato] Starting bank statement sync...');

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { diasAtras = 1, forceReconcile = false } = body;

    // Calcular datas
    const hoje = new Date();
    const dataFim = hoje.toISOString().split('T')[0];
    
    const dataInicio = new Date(hoje);
    dataInicio.setDate(dataInicio.getDate() - diasAtras);
    const dataInicioStr = dataInicio.toISOString().split('T')[0];

    console.log(`📅 [sync-inter-extrato] Fetching statement from ${dataInicioStr} to ${dataFim}`);

    // Obter extrato do Inter
    const extrato = await getInterExtrato(dataInicioStr, dataFim);

    if (!extrato.transacoes || extrato.transacoes.length === 0) {
      console.log('📭 [sync-inter-extrato] No transactions found in period');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No transactions found in period',
          period: { dataInicio: dataInicioStr, dataFim },
          transacoes: 0,
          reconciliation: null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📊 [sync-inter-extrato] Found ${extrato.transacoes.length} transactions`);

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar conta Inter
    const { data: contaInter } = await supabase
      .from('contas_bancarias')
      .select('id')
      .eq('banco', 'inter')
      .eq('is_principal', true)
      .single();

    const contaId = contaInter?.id;

    // Salvar transações no extrato_bancario
    const transacoesParaSalvar = extrato.transacoes.map((t: InterExtratoItem) => ({
      conta_id: contaId,
      data_transacao: t.dataEntrada,
      tipo: t.tipoOperacao === 'C' ? 'credito' : 'debito',
      valor: parseFloat(t.valor),
      descricao: t.descricao || t.titulo,
      codigo_transacao: t.idTransacao || `${t.dataEntrada}_${t.valor}_${Math.random().toString(36).substr(2, 9)}`,
      txid: t.endToEndId || null,
      codigo_barras: t.codigoBarra || null,
      tipo_transacao: t.tipoTransacao,
      conciliado: false,
    }));

    // Inserir transações (ignorar duplicatas)
    for (const transacao of transacoesParaSalvar) {
      const { error } = await supabase
        .from('extrato_bancario')
        .upsert(transacao, { 
          onConflict: 'codigo_transacao',
          ignoreDuplicates: true 
        });

      if (error && !error.message?.includes('duplicate')) {
        console.warn('⚠️ [sync-inter-extrato] Error saving transaction:', error);
      }
    }

    console.log(`💾 [sync-inter-extrato] Saved ${transacoesParaSalvar.length} transactions`);

    // Realizar conciliação automática
    const reconciliation = await reconcilePayments(supabase, extrato.transacoes);

    console.log(`✅ [sync-inter-extrato] Reconciliation complete:`, {
      matched: reconciliation.matched,
      unmatched: reconciliation.unmatched,
      errors: reconciliation.errors,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bank statement synchronized successfully',
        period: { dataInicio: dataInicioStr, dataFim },
        transacoes: extrato.transacoes.length,
        reconciliation: {
          matched: reconciliation.matched,
          unmatched: reconciliation.unmatched,
          errors: reconciliation.errors,
        },
        details: reconciliation.details,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ [sync-inter-extrato] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to sync bank statement',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

/**
 * Realiza conciliação automática de pagamentos
 * Cruza transações do extrato com parcelas/cobrancas pendentes
 */
async function reconcilePayments(
  supabase: ReturnType<typeof createClient>,
  transacoes: InterExtratoItem[]
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    matched: 0,
    unmatched: 0,
    errors: 0,
    details: [],
  };

  // Filtrar apenas créditos (recebimentos)
  const creditos = transacoes.filter(t => t.tipoOperacao === 'C');

  console.log(`🔍 [reconcile] Processing ${creditos.length} credit transactions`);

  for (const credito of creditos) {
    const valor = parseFloat(credito.valor);
    const txid = credito.endToEndId;
    const codigoBarras = credito.codigoBarra;

    try {
      // Tentar encontrar parcela correspondente
      let matched = false;

      // 1. Buscar por TXID (PIX)
      if (txid && !matched) {
        const { data: parcela, error } = await supabase
          .from('parcelas')
          .select('id, pedido_id, valor, status')
          .eq('inter_txid', txid)
          .eq('status', 'pendente')
          .single();

        if (parcela && !error) {
          // Marcar como pago
          await markParcelaAsPaid(supabase, parcela.id, parcela.pedido_id, {
            interTxid: txid,
            valorPago: valor,
            dataPagamento: credito.dataEntrada,
          });

          result.matched++;
          result.details.push({
            transacao: txid,
            valor,
            status: 'matched',
            parcelaId: parcela.id,
            pedidoId: parcela.pedido_id,
            message: 'Matched by PIX TXID',
          });
          matched = true;
        }
      }

      // 2. Buscar por código de barras (Boleto)
      if (codigoBarras && !matched) {
        const { data: parcela, error } = await supabase
          .from('parcelas')
          .select('id, pedido_id, valor, status')
          .eq('inter_codigo_barras', codigoBarras)
          .eq('status', 'pendente')
          .single();

        if (parcela && !error) {
          await markParcelaAsPaid(supabase, parcela.id, parcela.pedido_id, {
            codigoBarras,
            valorPago: valor,
            dataPagamento: credito.dataEntrada,
          });

          result.matched++;
          result.details.push({
            transacao: codigoBarras,
            valor,
            status: 'matched',
            parcelaId: parcela.id,
            pedidoId: parcela.pedido_id,
            message: 'Matched by boleto barcode',
          });
          matched = true;
        }
      }

      // 3. Buscar por valor exato + data aproximada (fallback)
      if (!matched) {
        const dataCredito = new Date(credito.dataEntrada);
        const dataLimite = new Date(dataCredito);
        dataLimite.setDate(dataLimite.getDate() + 3); // 3 dias de tolerância

        const { data: parcelas, error } = await supabase
          .from('parcelas')
          .select('id, pedido_id, valor, status, data_vencimento')
          .eq('status', 'pendente')
          .gte('valor', valor - 0.01)
          .lte('valor', valor + 0.01)
          .lte('data_vencimento', dataLimite.toISOString().split('T')[0])
          .order('data_vencimento', { ascending: true })
          .limit(1);

        if (parcelas && parcelas.length > 0 && !error) {
          const parcela = parcelas[0];
          
          await markParcelaAsPaid(supabase, parcela.id, parcela.pedido_id, {
            valorPago: valor,
            dataPagamento: credito.dataEntrada,
            matchType: 'value_date',
          });

          result.matched++;
          result.details.push({
            transacao: credito.idTransacao || `${valor}`,
            valor,
            status: 'matched',
            parcelaId: parcela.id,
            pedidoId: parcela.pedido_id,
            message: 'Matched by value and date range',
          });
          matched = true;
        }
      }

      // Não encontrou match
      if (!matched) {
        result.unmatched++;
        result.details.push({
          transacao: txid || codigoBarras || credito.idTransacao || `${valor}`,
          valor,
          status: 'unmatched',
          message: 'No matching pending payment found',
        });
      }

    } catch (error) {
      console.error('❌ [reconcile] Error processing transaction:', error);
      result.errors++;
      result.details.push({
        transacao: txid || codigoBarras || `${valor}`,
        valor,
        status: 'error',
        message: error.message || 'Processing error',
      });
    }
  }

  return result;
}

/**
 * Marca uma parcela como paga e atualiza o pedido
 */
async function markParcelaAsPaid(
  supabase: ReturnType<typeof createClient>,
  parcelaId: string,
  pedidoId: string,
  paymentData: {
    interTxid?: string;
    codigoBarras?: string;
    valorPago: number;
    dataPagamento: string;
    matchType?: string;
  }
): Promise<void> {
  console.log(`✅ [markParcelaAsPaid] Marking parcela ${parcelaId} as paid`);

  // Atualizar parcela
  await supabase
    .from('parcelas')
    .update({
      status: 'pago',
      data_pagamento: paymentData.dataPagamento,
      valor_pago: paymentData.valorPago,
      inter_conciliado: true,
      inter_conciliado_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', parcelaId);

  // Verificar se todas as parcelas do pedido estão pagas
  const { data: parcelasPendentes } = await supabase
    .from('parcelas')
    .select('id')
    .eq('pedido_id', pedidoId)
    .eq('status', 'pendente');

  // Se não há mais parcelas pendentes, marcar pedido como pago
  if (!parcelasPendentes || parcelasPendentes.length === 0) {
    console.log(`✅ [markParcelaAsPaid] All installments paid, updating order ${pedidoId}`);
    
    await supabase
      .from('pedidos')
      .update({
        status: 'pago',
        pagamento_confirmado: true,
        data_pagamento: paymentData.dataPagamento,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId);
  }

  // Marcar transação no extrato como conciliada
  if (paymentData.interTxid) {
    await supabase
      .from('extrato_bancario')
      .update({
        conciliado: true,
        origem_id: parcelaId,
        origem_tipo: 'parcela',
      })
      .eq('txid', paymentData.interTxid);
  }
}
