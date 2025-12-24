// Mercado Pago Payments Search
// Busca pagamentos com filtros avançados - retorna dados REAIS do MP
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 [MP-SEARCH] Iniciando busca de pagamentos...');
    
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    const body = await req.json().catch(() => ({}));
    const {
      status,
      date_from,
      date_to,
      limit = 50,
      offset = 0,
      payment_method,
      external_reference
    } = body;

    // Construir query params
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    params.append('sort', 'date_created');
    params.append('criteria', 'desc');

    if (status) params.append('status', status);
    if (date_from) params.append('begin_date', date_from);
    if (date_to) params.append('end_date', date_to);
    if (payment_method) params.append('payment_method_id', payment_method);
    if (external_reference) params.append('external_reference', external_reference);

    console.log('🔍 [MP-SEARCH] Query params:', params.toString());

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/search?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [MP-SEARCH] Erro API MP:', response.status, errorText);
      throw new Error(`Erro ao buscar pagamentos: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const rawResults = data.results || [];
    
    console.log(`📦 [MP-SEARCH] Recebidos ${rawResults.length} pagamentos do MP`);
    
    // Log detalhado do primeiro pagamento para debug
    if (rawResults.length > 0) {
      const sample = rawResults[0];
      console.log('📋 [MP-SEARCH] Exemplo de pagamento RAW:', JSON.stringify({
        id: sample.id,
        status: sample.status,
        date_created: sample.date_created,
        date_approved: sample.date_approved,
        transaction_amount: sample.transaction_amount,
        transaction_details: sample.transaction_details,
        fee_details: sample.fee_details,
        payment_method_id: sample.payment_method_id,
        payment_type_id: sample.payment_type_id,
        payer: sample.payer,
        external_reference: sample.external_reference,
        description: sample.description
      }, null, 2));
    }

    // Processar e mapear usando campos REAIS do Mercado Pago
    const payments = rawResults.map((payment: any) => {
      // Calcular taxa total
      let totalFees = 0;
      if (payment.fee_details && Array.isArray(payment.fee_details)) {
        totalFees = payment.fee_details.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0);
      }

      // Nome do pagador
      let payerName = '';
      if (payment.payer) {
        if (payment.payer.first_name) {
          payerName = `${payment.payer.first_name} ${payment.payer.last_name || ''}`.trim();
        } else if (payment.payer.email) {
          payerName = payment.payer.email.split('@')[0];
        }
      }

      return {
        // IDs e Referências
        id: payment.id,
        external_reference: payment.external_reference || null,
        
        // Datas
        date_created: payment.date_created,
        date_approved: payment.date_approved,
        money_release_date: payment.money_release_date,
        
        // Status
        status: payment.status,
        status_detail: payment.status_detail,
        
        // Valores - usando campos reais do MP
        transaction_amount: payment.transaction_amount || 0,
        net_received_amount: payment.transaction_details?.net_received_amount || 0,
        total_paid_amount: payment.transaction_details?.total_paid_amount || 0,
        fee_amount: totalFees,
        currency_id: payment.currency_id || 'BRL',
        
        // Método de pagamento - campos reais
        payment_method_id: payment.payment_method_id,
        payment_type_id: payment.payment_type_id,
        issuer_id: payment.issuer_id,
        installments: payment.installments,
        
        // Pagador - dados reais
        payer: {
          id: payment.payer?.id || null,
          email: payment.payer?.email || null,
          first_name: payment.payer?.first_name || null,
          last_name: payment.payer?.last_name || null,
          identification: payment.payer?.identification || null,
          phone: payment.payer?.phone || null
        },
        payer_name: payerName,
        payer_email: payment.payer?.email || null,
        
        // Descrição
        description: payment.description,
        
        // Card (se aplicável)
        card: payment.card ? {
          first_six_digits: payment.card.first_six_digits,
          last_four_digits: payment.card.last_four_digits,
          cardholder: payment.card.cardholder
        } : null
      };
    });

    // Calcular resumo
    const summary = {
      total_count: data.paging?.total || payments.length,
      returned_count: payments.length,
      total_amount: payments.reduce((sum: number, p: any) => sum + (p.transaction_amount || 0), 0),
      net_amount: payments.reduce((sum: number, p: any) => sum + (p.net_received_amount || 0), 0),
      total_fees: payments.reduce((sum: number, p: any) => sum + (p.fee_amount || 0), 0),
      by_status: {} as Record<string, number>,
      by_method: {} as Record<string, number>
    };

    for (const p of payments) {
      summary.by_status[p.status] = (summary.by_status[p.status] || 0) + 1;
      summary.by_method[p.payment_type_id || 'unknown'] = (summary.by_method[p.payment_type_id || 'unknown'] || 0) + 1;
    }

    console.log(`✅ [MP-SEARCH] Processados ${payments.length} pagamentos`);
    console.log(`💰 [MP-SEARCH] Total: R$ ${summary.total_amount.toFixed(2)} | Líquido: R$ ${summary.net_amount.toFixed(2)} | Taxas: R$ ${summary.total_fees.toFixed(2)}`);

    return new Response(JSON.stringify({
      payments,
      summary,
      paging: data.paging,
      source: 'mercadopago_api'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [MP-SEARCH] Erro:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro ao buscar pagamentos',
      payments: [],
      summary: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
