import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  proposalId: string;
  paymentMethod: 'pix' | 'boleto';
  selectedPlan: 'avista' | 'fidelidade';
  clientEmail: string;
  diaVencimento?: 5 | 10 | 15; // Only for boleto
}

function calculateNextDueDate(day: 5 | 10 | 15): string {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let dueDate: Date;

  // If today is before or on the due day, use this month
  // Otherwise, use next month
  if (currentDay <= day) {
    dueDate = new Date(currentYear, currentMonth, day);
  } else {
    dueDate = new Date(currentYear, currentMonth + 1, day);
  }

  // Ensure at least 3 business days from now
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 3);

  if (dueDate < minDate) {
    dueDate = new Date(currentYear, currentMonth + 1, day);
  }

  return dueDate.toISOString().split('T')[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, paymentMethod, selectedPlan, clientEmail, diaVencimento } = await req.json() as RequestBody;

    console.log('💳 Gerando pagamento para proposta:', { proposalId, paymentMethod, selectedPlan, diaVencimento });

    if (!proposalId || !paymentMethod || !selectedPlan) {
      throw new Error('Campos obrigatórios: proposalId, paymentMethod, selectedPlan');
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (proposalError || !proposal) {
      throw new Error(`Proposta não encontrada: ${proposalError?.message}`);
    }

    console.log('✅ Proposta encontrada:', proposal.number);

    // Calculate payment amount
    const amount = selectedPlan === 'avista' 
      ? proposal.cash_total_value 
      : proposal.fidel_monthly_value;

    if (amount < 5) {
      throw new Error('Valor mínimo para pagamento é R$ 5,00');
    }

    // Get Mercado Pago access token (try both possible secret names)
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    let paymentData: any = {};

    if (paymentMethod === 'pix') {
      // Generate PIX payment
      console.log('⚡ Gerando PIX...');

      const pixPayload = {
        transaction_amount: amount,
        description: `Proposta ${proposal.number} - EXA Mídia`,
        payment_method_id: 'pix',
        external_reference: `proposal:${proposalId}`, // Important for webhook detection!
        payer: {
          email: clientEmail || proposal.client_email || 'cliente@examidia.com.br',
          first_name: proposal.client_name?.split(' ')[0] || 'Cliente',
          last_name: proposal.client_name?.split(' ').slice(1).join(' ') || 'EXA',
        }
      };

      const pixResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `proposal-${proposalId}-${Date.now()}`,
        },
        body: JSON.stringify(pixPayload),
      });

      const pixResult = await pixResponse.json();

      if (!pixResponse.ok) {
        console.error('❌ Erro PIX:', pixResult);
        throw new Error(pixResult.message || 'Erro ao gerar PIX');
      }

      console.log('✅ PIX gerado com sucesso');

      paymentData = {
        method: 'pix',
        paymentId: pixResult.id,
        status: pixResult.status,
        qrCode: pixResult.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: pixResult.point_of_interaction?.transaction_data?.qr_code_base64,
        expiresAt: pixResult.date_of_expiration,
      };

    } else if (paymentMethod === 'boleto') {
      // Generate Boleto payment
      console.log('📄 Gerando Boleto...');

      const dueDate = calculateNextDueDate(diaVencimento || 10);
      console.log('📅 Data de vencimento:', dueDate);

      const boletoPayload = {
        transaction_amount: amount,
        description: `Proposta ${proposal.number} - EXA Mídia`,
        payment_method_id: 'bolbradesco',
        external_reference: `proposal:${proposalId}`, // Important for webhook detection!
        date_of_expiration: `${dueDate}T23:59:59.000-03:00`,
        payer: {
          email: clientEmail || proposal.client_email || 'cliente@examidia.com.br',
          first_name: proposal.client_name?.split(' ')[0] || 'Cliente',
          last_name: proposal.client_name?.split(' ').slice(1).join(' ') || 'EXA',
          identification: {
            type: proposal.client_cnpj && proposal.client_cnpj.length > 14 ? 'CNPJ' : 'CPF',
            number: proposal.client_cnpj?.replace(/\D/g, '') || '00000000000',
          },
          address: {
            zip_code: '85851-000',
            street_name: 'Avenida Brasil',
            street_number: '1000',
            neighborhood: 'Centro',
            city: 'Foz do Iguaçu',
            federal_unit: 'PR',
          }
        }
      };

      const boletoResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `proposal-boleto-${proposalId}-${Date.now()}`,
        },
        body: JSON.stringify(boletoPayload),
      });

      const boletoResult = await boletoResponse.json();

      if (!boletoResponse.ok) {
        console.error('❌ Erro Boleto:', boletoResult);
        throw new Error(boletoResult.message || 'Erro ao gerar Boleto');
      }

      console.log('✅ Boleto gerado com sucesso');

      paymentData = {
        method: 'boleto',
        paymentId: boletoResult.id,
        status: boletoResult.status,
        boletoUrl: boletoResult.transaction_details?.external_resource_url,
        boletoBarcode: boletoResult.barcode?.content,
        dueDate: dueDate,
        diaVencimento: diaVencimento || 10,
      };
    }

    // Save payment data in proposal metadata
    const existingMetadata = proposal.metadata || {};
    await supabase
      .from('proposals')
      .update({
        metadata: {
          ...existingMetadata,
          payment: paymentData,
          payment_generated_at: new Date().toISOString(),
        }
      })
      .eq('id', proposalId);

    // Log action
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'pagamento_gerado',
      details: {
        method: paymentMethod,
        selected_plan: selectedPlan,
        amount,
        payment_id: paymentData.paymentId,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Pagamento processado com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        paymentData,
        amount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Erro em generate-proposal-payment:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
