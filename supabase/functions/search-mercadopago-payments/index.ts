// Mercado Pago Payments Search
// Busca pagamentos com filtros avançados
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
    console.log('🔍 [MP-SEARCH] Buscando pagamentos...');
    
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
      throw new Error(`Erro ao buscar pagamentos: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Processar e enriquecer os dados
    const payments = (data.results || []).map((payment: any) => ({
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      date_created: payment.date_created,
      date_approved: payment.date_approved,
      money_release_date: payment.money_release_date,
      external_reference: payment.external_reference,
      payment_method: {
        id: payment.payment_method_id,
        type: payment.payment_type_id,
        issuer: payment.issuer_id
      },
      amounts: {
        transaction: payment.transaction_amount,
        net_received: payment.transaction_details?.net_received_amount || 0,
        total_paid: payment.transaction_details?.total_paid_amount || 0,
        currency: payment.currency_id
      },
      fees: payment.fee_details || [],
      payer: {
        id: payment.payer?.id,
        email: payment.payer?.email,
        first_name: payment.payer?.first_name,
        last_name: payment.payer?.last_name,
        identification: payment.payer?.identification
      },
      description: payment.description,
      installments: payment.installments
    }));

    // Calcular resumo
    const summary = {
      total_count: data.paging?.total || payments.length,
      returned_count: payments.length,
      total_amount: payments.reduce((sum: number, p: any) => sum + (p.amounts?.transaction || 0), 0),
      net_amount: payments.reduce((sum: number, p: any) => sum + (p.amounts?.net_received || 0), 0),
      by_status: {} as Record<string, number>,
      by_method: {} as Record<string, number>
    };

    for (const p of payments) {
      summary.by_status[p.status] = (summary.by_status[p.status] || 0) + 1;
      summary.by_method[p.payment_method.id] = (summary.by_method[p.payment_method.id] || 0) + 1;
    }

    console.log(`✅ [MP-SEARCH] Encontrados ${payments.length} pagamentos`);

    return new Response(JSON.stringify({
      payments,
      summary,
      paging: data.paging
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [MP-SEARCH] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro ao buscar pagamentos'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
