import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelResult {
  payment_id: string;
  success: boolean;
  status?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MERCADO_PAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!MERCADO_PAGO_ACCESS_TOKEN) {
      console.error('❌ MERCADO_PAGO_ACCESS_TOKEN não configurado');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token do Mercado Pago não configurado' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { payment_ids } = await req.json();

    if (!payment_ids || !Array.isArray(payment_ids) || payment_ids.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'payment_ids é obrigatório e deve ser um array não vazio' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`💳 [BOLETO_CANCEL] Iniciando cancelamento de ${payment_ids.length} pagamento(s)`);
    console.log(`   IDs: ${payment_ids.join(', ')}`);

    const results: CancelResult[] = [];
    let cancelledCount = 0;
    let failedCount = 0;

    for (const paymentId of payment_ids) {
      try {
        console.log(`   📤 Cancelando payment_id: ${paymentId}`);
        
        const response = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'cancelled' })
          }
        );

        const responseData = await response.json();

        if (response.ok) {
          console.log(`   ✅ Payment ${paymentId} cancelado com sucesso`);
          results.push({
            payment_id: paymentId,
            success: true,
            status: 'cancelled'
          });
          cancelledCount++;
        } else {
          // Verificar se já está cancelado ou expirado (não é erro real)
          if (responseData.status === 'cancelled' || responseData.status === 'rejected') {
            console.log(`   ℹ️ Payment ${paymentId} já estava ${responseData.status}`);
            results.push({
              payment_id: paymentId,
              success: true,
              status: responseData.status
            });
            cancelledCount++;
          } else {
            console.error(`   ❌ Erro ao cancelar ${paymentId}:`, responseData);
            results.push({
              payment_id: paymentId,
              success: false,
              error: responseData.message || `HTTP ${response.status}`
            });
            failedCount++;
          }
        }
      } catch (error) {
        console.error(`   💥 Exceção ao cancelar ${paymentId}:`, error);
        results.push({
          payment_id: paymentId,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        failedCount++;
      }
    }

    console.log(`\n📊 [BOLETO_CANCEL] Resumo:`);
    console.log(`   ✅ Cancelados: ${cancelledCount}`);
    console.log(`   ❌ Falhas: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: failedCount === 0,
        cancelled_count: cancelledCount,
        failed_count: failedCount,
        total_requested: payment_ids.length,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 [BOLETO_CANCEL] Erro fatal:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
