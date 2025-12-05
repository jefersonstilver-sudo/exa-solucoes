import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  proposalId: string;
  clientEmail: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, clientEmail } = await req.json() as RequestBody;

    console.log('💳 [CREATE-SUBSCRIPTION] Iniciando assinatura recorrente:', { proposalId, clientEmail });

    if (!proposalId) {
      throw new Error('proposalId é obrigatório');
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

    // Calculate monthly value
    const durationMonths = proposal.duration_months || 1;
    let monthlyValue: number;
    let totalValue: number;

    // Check if custom payment
    const isCustomPayment = proposal.payment_type === 'custom' && Array.isArray(proposal.custom_installments);
    
    if (isCustomPayment) {
      // For custom payments, calculate average monthly value
      const customInstallments = proposal.custom_installments;
      totalValue = customInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount || 0), 0);
      monthlyValue = totalValue / customInstallments.length;
      console.log('💳 Pagamento personalizado:', { totalValue, monthlyValue, parcelas: customInstallments.length });
    } else {
      // Standard calculation
      totalValue = proposal.fidel_monthly_value * durationMonths;
      monthlyValue = proposal.fidel_monthly_value;
      console.log('💳 Pagamento padrão:', { totalValue, monthlyValue, meses: durationMonths });
    }

    // Get Mercado Pago access token
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Create Preapproval (subscription) in Mercado Pago
    console.log('🔄 Criando assinatura no Mercado Pago...');
    
    const siteUrl = Deno.env.get('SITE_URL') || 'https://examidia.com.br';

    const preapprovalPayload = {
      reason: `Publicidade EXA Mídia - Proposta ${proposal.number}`,
      external_reference: `subscription:${proposalId}`,
      payer_email: clientEmail || proposal.client_email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Math.round(monthlyValue * 100) / 100, // Round to 2 decimals
        currency_id: "BRL",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      },
      back_url: `${siteUrl}/assinatura-confirmada?proposalId=${proposalId}`,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-subscription-webhook`
    };

    console.log('📤 Payload Mercado Pago:', JSON.stringify(preapprovalPayload, null, 2));

    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preapprovalPayload),
    });

    const mpResult = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('❌ Erro Mercado Pago:', mpResult);
      throw new Error(mpResult.message || mpResult.error || 'Erro ao criar assinatura no Mercado Pago');
    }

    console.log('✅ Assinatura criada:', mpResult.id);
    console.log('🔗 Init Point:', mpResult.init_point);

    // Save subscription data in proposal metadata
    const existingMetadata = proposal.metadata || {};
    await supabase
      .from('proposals')
      .update({
        metadata: {
          ...existingMetadata,
          subscription: {
            subscription_id: mpResult.id,
            status: mpResult.status,
            monthly_value: monthlyValue,
            total_months: durationMonths,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            created_at: new Date().toISOString()
          }
        }
      })
      .eq('id', proposalId);

    // Log action
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'assinatura_cartao_criada',
      details: {
        subscription_id: mpResult.id,
        monthly_value: monthlyValue,
        total_months: durationMonths,
        is_custom_payment: isCustomPayment,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Assinatura recorrente criada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        subscriptionId: mpResult.id,
        initPoint: mpResult.init_point,
        sandboxInitPoint: mpResult.sandbox_init_point,
        monthlyValue,
        totalMonths: durationMonths,
        totalValue
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Erro em create-subscription-payment:', error);

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
