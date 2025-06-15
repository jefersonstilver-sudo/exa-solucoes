
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

    console.log("🔄 [ProcessPixPayment] PROCESSANDO PAGAMENTO:", {
      transactionId,
      pedidoId
    });

    if (!transactionId || !pedidoId) {
      throw new Error("transactionId e pedidoId são obrigatórios");
    }

    // CORREÇÃO CRÍTICA: Buscar pedido por ID diretamente
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
      valor_total: pedido.valor_total,
      transaction_id: pedido.transaction_id
    });

    // USAR PREÇO DO PEDIDO (sem recalcular!)
    const finalAmount = pedido.valor_total * 0.95; // 5% discount PIX

    // Gerar QR Code PIX mais realista (substitua pela integração real do MercadoPago)
    const pixQrCode = generatePixQrCode(finalAmount, pedido.id);
    const pixData = {
      qrCodeBase64: pixQrCode,
      qrCode: `00020126580014BR.GOV.BCB.PIX0136${generatePixKey()}0204${finalAmount.toFixed(2)}5303986540${finalAmount.toFixed(2)}5802BR5925INDEXA DIGITAL LTDA6009SAO_PAULO61058010062070503***63045D3A`,
      paymentId: `pix_${transactionId}_${Date.now()}`,
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

    console.log("✅ [ProcessPixPayment] PAGAMENTO PIX PROCESSADO:", {
      pedidoId: pedido.id,
      finalAmount,
      pixPaymentId: pixData.paymentId,
      hasQrCode: !!pixData.qrCodeBase64
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

// Função para gerar QR Code PIX simulado (substitua por integração real)
function generatePixQrCode(amount: number, pedidoId: string): string {
  // Gerar um QR Code simples e válido em base64
  // Em produção, use a API do MercadoPago para gerar QR Code real
  const qrData = `PIX_PAYMENT_${amount.toFixed(2)}_${pedidoId}`;
  
  // Simulação de QR Code em base64 (substitua por geração real)
  const canvas = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <g fill="black">
        <rect x="10" y="10" width="10" height="10"/>
        <rect x="30" y="10" width="10" height="10"/>
        <rect x="50" y="10" width="10" height="10"/>
        <rect x="70" y="10" width="10" height="10"/>
        <rect x="90" y="10" width="10" height="10"/>
        <rect x="10" y="30" width="10" height="10"/>
        <rect x="50" y="30" width="10" height="10"/>
        <rect x="90" y="30" width="10" height="10"/>
        <rect x="10" y="50" width="10" height="10"/>
        <rect x="30" y="50" width="10" height="10"/>
        <rect x="70" y="50" width="10" height="10"/>
        <rect x="90" y="50" width="10" height="10"/>
      </g>
      <text x="100" y="190" text-anchor="middle" font-size="8" fill="black">PIX ${amount.toFixed(2)}</text>
    </svg>
  `;
  
  // Converter SVG para base64
  const base64 = btoa(canvas);
  return `data:image/svg+xml;base64,${base64}`;
}

// Função para gerar chave PIX simulada
function generatePixKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
