import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createPixCharge } from '../_shared/asaas-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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

    // Verificar se Asaas está configurado
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não configurada');
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
      .select('*, pedidos(*, users:client_id(nome, email, cpf, empresa_documento, telefone))')
      .eq('id', body.parcela_id)
      .single();

    if (parcelaError || !parcela) {
      console.error('[GENERATE-PIX-PARCELA] Parcela não encontrada:', parcelaError);
      throw new Error('Parcela não encontrada');
    }

    console.log('[GENERATE-PIX-PARCELA] Parcela encontrada:', parcela);

    // Preparar dados do cliente
    const user = parcela.pedidos?.users;
    const cpfCnpj = (user?.cpf || user?.empresa_documento)?.replace(/\D/g, '');
    
    const customerData = {
      name: user?.nome || 'Cliente EXA',
      email: user?.email || undefined,
      cpfCnpj: cpfCnpj || undefined,
      mobilePhone: user?.telefone?.replace(/\D/g, '') || undefined,
    };

    // Criar cobrança PIX via Asaas
    const pixResult = await createPixCharge(
      customerData,
      body.valor,
      body.descricao || `Parcela ${parcela.numero_parcela} - EXA Painéis Digitais`,
      body.parcela_id // external reference
    );

    console.log('[GENERATE-PIX-PARCELA] PIX gerado via Asaas:', {
      paymentId: pixResult.paymentId,
      hasQrCode: !!pixResult.qrCodeBase64
    });

    // Atualizar parcela com dados do PIX
    const { error: updateError } = await supabase
      .from('parcelas')
      .update({
        asaas_payment_id: pixResult.paymentId,
        pix_qr_code: pixResult.qrCodeBase64,
        pix_copia_cola: pixResult.pixCopiaECola,
        status: 'aguardando_pagamento',
        metodo_pagamento: 'pix',
        updated_at: new Date().toISOString()
      })
      .eq('id', body.parcela_id);

    if (updateError) {
      console.error('[GENERATE-PIX-PARCELA] Erro ao atualizar parcela:', updateError);
    }

    console.log('[GENERATE-PIX-PARCELA] PIX gerado com sucesso');

    return new Response(JSON.stringify({
      success: true,
      payment_id: pixResult.paymentId,
      qrCode: pixResult.pixCopiaECola,
      qrCodeBase64: pixResult.qrCodeBase64,
      ticketUrl: pixResult.invoiceUrl,
      external_reference: body.parcela_id,
      status: pixResult.status
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
