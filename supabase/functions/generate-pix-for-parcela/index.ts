import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PixParcelaRequest {
  parcela_id: string;
  valor: number;
  descricao?: string;
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

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado');
    }

    const body: PixParcelaRequest = await req.json();
    console.log('[GENERATE-PIX-PARCELA] Recebido:', JSON.stringify(body, null, 2));

    // Validar dados obrigatórios
    if (!body.parcela_id || !body.valor) {
      throw new Error('Dados incompletos: parcela_id e valor são obrigatórios');
    }

    // Buscar parcela e pedido
    const { data: parcela, error: parcelaError } = await supabase
      .from('parcelas')
      .select('*, pedidos(*)')
      .eq('id', body.parcela_id)
      .single();

    if (parcelaError || !parcela) {
      console.error('[GENERATE-PIX-PARCELA] Parcela não encontrada:', parcelaError);
      throw new Error('Parcela não encontrada');
    }

    console.log('[GENERATE-PIX-PARCELA] Parcela encontrada:', parcela);

    // Gerar external_reference único
    const externalReference = `PIX_PARCELA_${body.parcela_id}_${Date.now()}`;

    // Criar pagamento PIX no Mercado Pago
    const paymentData = {
      transaction_amount: body.valor,
      description: body.descricao || `Parcela ${parcela.numero_parcela} - EXA Painéis Digitais`,
      payment_method_id: 'pix',
      external_reference: externalReference,
      payer: {
        email: parcela.pedidos?.client_email || 'cliente@exa.com.br'
      }
    };

    console.log('[GENERATE-PIX-PARCELA] Enviando para MP:', JSON.stringify(paymentData, null, 2));

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': externalReference
      },
      body: JSON.stringify(paymentData)
    });

    const mpData = await mpResponse.json();
    console.log('[GENERATE-PIX-PARCELA] Resposta MP:', JSON.stringify(mpData, null, 2));

    if (!mpResponse.ok) {
      throw new Error(`Erro Mercado Pago: ${JSON.stringify(mpData)}`);
    }

    // Extrair dados do PIX
    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url;

    if (!qrCode || !qrCodeBase64) {
      throw new Error('Dados do PIX não retornados pelo Mercado Pago');
    }

    // Atualizar parcela com dados do PIX
    const { error: updateError } = await supabase
      .from('parcelas')
      .update({
        mercadopago_payment_id: String(mpData.id),
        mercadopago_external_reference: externalReference,
        pix_qr_code: qrCodeBase64,
        pix_copia_cola: qrCode,
        status: 'aguardando_pagamento',
        metodo_pagamento: 'pix',
        updated_at: new Date().toISOString()
      })
      .eq('id', body.parcela_id);

    if (updateError) {
      console.error('[GENERATE-PIX-PARCELA] Erro ao atualizar parcela:', updateError);
    }

    console.log('[GENERATE-PIX-PARCELA] PIX gerado com sucesso:', {
      payment_id: mpData.id,
      has_qr_code: !!qrCode
    });

    return new Response(JSON.stringify({
      success: true,
      payment_id: mpData.id,
      qrCode: qrCode,
      qrCodeBase64: qrCodeBase64,
      ticketUrl: ticketUrl,
      external_reference: externalReference,
      status: mpData.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[GENERATE-PIX-PARCELA] Erro:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
