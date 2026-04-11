import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dados da empresa jurídica (Indexa Midia opera a marca ExaMídia)
const EXA_COMPANY_DATA = {
  razao_social: 'Indexa Midia LTDA',
  cnpj: '38.142.638/0001-30',
  endereco: 'Avenida Paraná, 974 - Sala 301',
  bairro: 'Centro',
  cidade: 'Foz do Iguaçu',
  estado: 'PR',
  cep: '85852-000',
  telefone: '(45) 9 9141-5856',
  whatsapp: '+5545991415856',
  site: 'www.examidia.com.br',
  email_contato: 'contato@examidia.com.br',
  email_financeiro: 'financeiro@examidia.com.br'
};

interface BoletoRequest {
  parcela_id: string;
  valor: number;
  vencimento: string;
  descricao: string;
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification: {
      type: string;
      number: string;
    };
    address: {
      zip_code: string;
      street_name: string;
      street_number: string;
      neighborhood: string;
      city: string;
      federal_unit: string;
    };
  };
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

    const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    const body: BoletoRequest = await req.json();
    console.log('[GENERATE-BOLETO] Recebido:', JSON.stringify(body, null, 2));

    // Validar dados obrigatórios
    if (!body.parcela_id || !body.valor || !body.vencimento || !body.payer) {
      throw new Error('Dados incompletos para gerar boleto');
    }

    // Buscar parcela e pedido
    const { data: parcela, error: parcelaError } = await supabase
      .from('parcelas')
      .select('*, pedidos(*)')
      .eq('id', body.parcela_id)
      .single();

    if (parcelaError || !parcela) {
      throw new Error('Parcela não encontrada');
    }

    // Gerar external_reference único
    const externalReference = `PARCELA_${body.parcela_id}_${Date.now()}`;

    // Criar pagamento no Mercado Pago com boleto
    const paymentData = {
      transaction_amount: body.valor,
      description: body.descricao || `Parcela ${parcela.numero_parcela} - EXA Painéis`,
      payment_method_id: 'bolbradesco',
      date_of_expiration: new Date(body.vencimento + 'T23:59:59-03:00').toISOString(),
      external_reference: externalReference,
      statement_descriptor: 'EXA PAINEIS',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      payer: {
        email: body.payer.email,
        first_name: body.payer.first_name,
        last_name: body.payer.last_name,
        identification: body.payer.identification,
        address: body.payer.address
      },
      additional_info: {
        items: [{
          id: body.parcela_id,
          title: body.descricao || `Parcela - EXA Painéis`,
          description: `Serviço de publicidade em painéis digitais - ${EXA_COMPANY_DATA.razao_social}`,
          category_id: 'services',
          quantity: 1,
          unit_price: body.valor
        }],
        payer: {
          first_name: body.payer.first_name,
          last_name: body.payer.last_name
        }
      }
    };

    console.log('[GENERATE-BOLETO] Dados da empresa EXA:', EXA_COMPANY_DATA);

    console.log('[GENERATE-BOLETO] Enviando para MP:', JSON.stringify(paymentData, null, 2));

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
    console.log('[GENERATE-BOLETO] Resposta MP:', JSON.stringify(mpData, null, 2));

    if (!mpResponse.ok) {
      throw new Error(`Erro Mercado Pago: ${JSON.stringify(mpData)}`);
    }

    // Extrair dados do boleto
    const boletoUrl = mpData.transaction_details?.external_resource_url;
    const boletoBarcode = mpData.barcode?.content;

    // Atualizar parcela com dados do boleto
    const { error: updateError } = await supabase
      .from('parcelas')
      .update({
        mercadopago_payment_id: String(mpData.id),
        mercadopago_external_reference: externalReference,
        boleto_url: boletoUrl,
        boleto_barcode: boletoBarcode,
        status: 'aguardando_pagamento',
        metodo_pagamento: 'boleto',
        updated_at: new Date().toISOString()
      })
      .eq('id', body.parcela_id);

    if (updateError) {
      console.error('[GENERATE-BOLETO] Erro ao atualizar parcela:', updateError);
    }

    console.log('[GENERATE-BOLETO] Boleto gerado com sucesso:', {
      payment_id: mpData.id,
      boleto_url: boletoUrl
    });

    return new Response(JSON.stringify({
      success: true,
      payment_id: mpData.id,
      boleto_url: boletoUrl,
      boleto_barcode: boletoBarcode,
      external_reference: externalReference,
      status: mpData.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[GENERATE-BOLETO] Erro:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
