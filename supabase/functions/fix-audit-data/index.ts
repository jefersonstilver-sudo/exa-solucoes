// Fix Audit Data - Migração de dados de auditoria para pedidos antigos
// Esta função busca pedidos pagos sem compliance_data e atualiza com dados do Mercado Pago
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    console.log('🔍 [FIX-AUDIT] Buscando pedidos para atualizar...');

    // Buscar pedidos pagos sem compliance_data completo
    const { data: pedidos, error: fetchError } = await supabase
      .from('pedidos')
      .select('*')
      .in('status', ['pago_pendente_video', 'ativo', 'pago'])
      .or('compliance_data.is.null,compliance_data->payer.is.null');

    if (fetchError) throw fetchError;

    console.log(`📊 [FIX-AUDIT] Encontrados ${pedidos?.length || 0} pedidos para atualizar`);

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const pedido of pedidos || []) {
      try {
        const paymentId = pedido.log_pagamento?.pixData?.paymentId;
        
        if (!paymentId) {
          console.warn(`⚠️ [FIX-AUDIT] Pedido ${pedido.id} sem paymentId`);
          failed++;
          errors.push(`Pedido ${pedido.id}: sem paymentId`);
          continue;
        }

        console.log(`🔄 [FIX-AUDIT] Processando pedido ${pedido.id}, payment ${paymentId}`);

        // Buscar dados do MP
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!mpResponse.ok) {
          console.error(`❌ [FIX-AUDIT] Erro ao buscar pagamento ${paymentId}: ${mpResponse.statusText}`);
          failed++;
          errors.push(`Pedido ${pedido.id}: erro ao buscar MP - ${mpResponse.statusText}`);
          continue;
        }

        const payment = await mpResponse.json();

        // Construir auditData
        const auditData = {
          payer: {
            id: payment.payer?.id || null,
            email: payment.payer?.email || null,
            first_name: payment.payer?.first_name || null,
            last_name: payment.payer?.last_name || null,
            phone: payment.payer?.phone || null,
            identification: {
              type: payment.payer?.identification?.type || null,
              number: payment.payer?.identification?.number || null
            },
            entity_type: payment.payer?.entity_type || null
          },
          payment_method: {
            id: payment.payment_method_id || null,
            type: payment.payment_method?.type || null,
            issuer_id: payment.issuer_id || null
          },
          transaction_details: {
            financial_institution: payment.transaction_details?.financial_institution || null,
            net_received_amount: payment.transaction_details?.net_received_amount || 0,
            total_paid_amount: payment.transaction_details?.total_paid_amount || 0,
            overpaid_amount: payment.transaction_details?.overpaid_amount || 0,
            installment_amount: payment.transaction_details?.installment_amount || 0
          },
          collector: {
            id: payment.collector_id || null,
            email: payment.collector?.email || null,
            nickname: payment.collector?.nickname || null
          },
          dates: {
            created: payment.date_created,
            approved: payment.date_approved,
            last_updated: payment.date_last_updated
          },
          status: {
            current: payment.status,
            detail: payment.status_detail,
            reason: payment.status_detail || null
          },
          amounts: {
            transaction_amount: payment.transaction_amount,
            currency_id: payment.currency_id,
            taxes_amount: payment.taxes_amount || 0
          },
          references: {
            external_reference: payment.external_reference,
            payment_id: payment.id,
            operation_type: payment.operation_type
          },
          security: {
            processing_mode: payment.processing_mode,
            merchant_account_id: payment.merchant_account_id || null
          }
        };

        // Atualizar log_pagamento com mpResponse correto
        const updatedLogPagamento = {
          ...(pedido.log_pagamento || {}),
          pixData: {
            ...(pedido.log_pagamento?.pixData || {}),
            mpResponse: {
              id: payment.id,
              status: payment.status,
              status_detail: payment.status_detail,
              currency_id: payment.currency_id,
              payment_type_id: payment.payment_type_id,
              payment_method_id: payment.payment_method_id
            },
            transactionDetails: auditData.transaction_details,
            payer: auditData.payer
          },
          processing_metadata: {
            ...(pedido.log_pagamento?.processing_metadata || {}),
            migrated_at: new Date().toISOString(),
            migration_source: 'fix-audit-data'
          }
        };

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('pedidos')
          .update({
            compliance_data: auditData,
            log_pagamento: updatedLogPagamento,
            metodo_pagamento: payment.payment_method_id
          })
          .eq('id', pedido.id);

        if (updateError) {
          console.error(`❌ [FIX-AUDIT] Erro ao atualizar pedido ${pedido.id}:`, updateError);
          failed++;
          errors.push(`Pedido ${pedido.id}: erro ao atualizar - ${updateError.message}`);
        } else {
          console.log(`✅ [FIX-AUDIT] Pedido ${pedido.id} atualizado com sucesso`);
          updated++;
        }

        // Delay para não sobrecarregar a API do MP
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`❌ [FIX-AUDIT] Erro ao processar pedido ${pedido.id}:`, error);
        failed++;
        errors.push(`Pedido ${pedido.id}: ${error.message}`);
      }
    }

    // Log no sistema
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'AUDIT_DATA_MIGRATION',
      descricao: `Migração de dados de auditoria concluída: ${updated} atualizados, ${failed} falharam`
    });

    console.log(`🎉 [FIX-AUDIT] Migração concluída: ${updated} atualizados, ${failed} falharam`);

    return new Response(JSON.stringify({
      success: true,
      total: pedidos?.length || 0,
      updated,
      failed,
      errors: failed > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [FIX-AUDIT] Erro geral:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
