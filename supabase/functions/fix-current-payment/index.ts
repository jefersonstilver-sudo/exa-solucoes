
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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

    console.log("🔧 [FIX_PAYMENT] Iniciando correção do pagamento atual");

    // Buscar o pedido pendente mais recente
    const { data: pedidoPendente, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(1);

    if (pedidoError || !pedidoPendente || pedidoPendente.length === 0) {
      console.log("❌ [FIX_PAYMENT] Nenhum pedido pendente encontrado");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Nenhum pedido pendente encontrado" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pedido = pedidoPendente[0];
    console.log("📊 [FIX_PAYMENT] Pedido encontrado:", {
      id: pedido.id,
      valor: pedido.valor_total,
      status: pedido.status,
      created_at: pedido.created_at
    });

    // Atualizar o pedido para pago_pendente_video
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        status: 'pago_pendente_video',
        transaction_id: '117434493988', // Transaction ID correto do MercadoPago
        log_pagamento: {
          ...pedido.log_pagamento,
          payment_method: 'pix',
          payment_status: 'approved',
          fixed_manually: true,
          fixed_at: new Date().toISOString(),
          original_transaction_id: '117434493988',
          fix_reason: 'Webhook não recebido - correção manual'
        }
      })
      .eq('id', pedido.id);

    if (updateError) {
      console.error("❌ [FIX_PAYMENT] Erro ao atualizar pedido:", updateError);
      throw updateError;
    }

    // Registrar o tracking da correção
    await supabase
      .from('payment_status_tracking')
      .insert({
        pedido_id: pedido.id,
        status_anterior: 'pendente',
        status_novo: 'pago_pendente_video',
        origem: 'manual_fix',
        detalhes: {
          fixed_manually: true,
          transaction_id: '117434493988',
          valor_total: pedido.valor_total,
          fix_timestamp: new Date().toISOString()
        }
      });

    // Log do sistema
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'PAYMENT_MANUALLY_FIXED',
        descricao: `Pagamento corrigido manualmente: Pedido ${pedido.id} - Valor: R$ ${pedido.valor_total} - Transaction: 117434493988`
      });

    console.log("✅ [FIX_PAYMENT] Pagamento corrigido com sucesso!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pagamento corrigido com sucesso!",
        pedido_id: pedido.id,
        novo_status: 'pago_pendente_video',
        transaction_id: '117434493988',
        valor_total: pedido.valor_total
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("❌ [FIX_PAYMENT] Erro na correção:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: "Erro interno na correção do pagamento"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
