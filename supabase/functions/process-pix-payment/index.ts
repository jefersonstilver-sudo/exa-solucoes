
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

    console.log("🔄 [ProcessPixPayment] Processando pagamento unificado:", {
      transactionId,
      pedidoId
    });

    if (!transactionId || !pedidoId) {
      throw new Error("transactionId e pedidoId são obrigatórios");
    }

    // Buscar pedido por ID e verificar transaction_id
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .eq('transaction_id', transactionId)
      .single();

    if (pedidoError || !pedido) {
      throw new Error(`Pedido não encontrado: ${pedidoError?.message}`);
    }

    console.log("✅ [ProcessPixPayment] Pedido encontrado:", {
      id: pedido.id,
      valor_total: pedido.valor_total,
      transaction_id: pedido.transaction_id
    });

    // Usar preço do pedido com desconto PIX
    const finalAmount = pedido.valor_total * 0.95; // 5% discount PIX

    // Simular criação do QR Code PIX (substitua pela integração real)
    const pixData = {
      qrCodeBase64: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`,
      qrCode: `00020126330014BR.GOV.BCB.PIX0111${transactionId}5204000053039865802BR5925INDEXA MIDIA DIGITAL LTDA6009SAO PAULO62070503***6304`,
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
          unified_system: true,
          processed_via: 'unified_edge_function',
          final_amount: finalAmount,
          original_amount: pedido.valor_total,
          discount_applied: 5,
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', pedido.id);

    if (updateError) {
      throw updateError;
    }

    console.log("✅ [ProcessPixPayment] Pagamento PIX processado com sucesso:", {
      pedidoId: pedido.id,
      finalAmount,
      pixPaymentId: pixData.paymentId
    });

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
