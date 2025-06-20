
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

    const { transactionId, pedidoId } = await req.json();

    console.log("🔄 [ProcessPixPayment] Processando pagamento PIX:", {
      transactionId,
      pedidoId
    });

    if (!transactionId || !pedidoId) {
      throw new Error("transactionId e pedidoId são obrigatórios");
    }

    // Buscar pedido por ID
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      throw new Error(`Pedido não encontrado: ${pedidoError?.message}`);
    }

    console.log("✅ [ProcessPixPayment] Pedido encontrado:", {
      id: pedido.id,
      valor_total: pedido.valor_total
    });

    // Calcular valor final com desconto PIX (5%)
    const finalAmount = pedido.valor_total * 0.95;

    // Gerar dados PIX (simulação - substituir por integração real com Mercado Pago)
    const pixData = {
      qrCodeBase64: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
      qrCode: `PIX_${transactionId}_${finalAmount.toFixed(2).replace('.', '')}`,
      paymentId: `pix_${transactionId}`,
      status: 'pending'
    };

    // Atualizar pedido com dados do PIX
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          ...pedido.log_pagamento,
          pix_data: pixData,
          processed_at: new Date().toISOString(),
          final_amount: finalAmount,
          original_amount: pedido.valor_total,
          discount_applied: 5
        }
      })
      .eq('id', pedido.id);

    if (updateError) {
      throw updateError;
    }

    console.log("✅ [ProcessPixPayment] PIX processado com sucesso");

    return new Response(
      JSON.stringify({
        success: true,
        pixData,
        pedidoId: pedido.id,
        amount: finalAmount,
        message: "QR Code PIX gerado com sucesso"
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error("❌ [ProcessPixPayment] Erro:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
