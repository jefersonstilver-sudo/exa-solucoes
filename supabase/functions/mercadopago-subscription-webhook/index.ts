import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('========================================');
  console.log('🔔 [SUBSCRIPTION-WEBHOOK] Recebendo notificação');
  console.log('========================================');

  try {
    const body = await req.json();
    console.log('📥 Body:', JSON.stringify(body, null, 2));

    const { type, data, action } = body;
    console.log('📌 Tipo:', type, '| Ação:', action);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    // Handle subscription events
    if (type === 'subscription_preapproval') {
      const preapprovalId = data?.id;
      console.log('📋 Preapproval ID:', preapprovalId);

      // Fetch subscription details from Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` }
      });

      if (!mpResponse.ok) {
        console.error('❌ Erro ao buscar assinatura no MP');
        throw new Error('Erro ao buscar assinatura');
      }

      const subscription = await mpResponse.json();
      console.log('📄 Assinatura MP:', JSON.stringify(subscription, null, 2));

      const externalReference = subscription.external_reference || '';
      const proposalId = externalReference.replace('subscription:', '');
      console.log('🔗 Proposal ID extraído:', proposalId);

      if (!proposalId || proposalId === externalReference) {
        console.log('⚠️ External reference não é de proposta, ignorando');
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Handle different subscription statuses
      if (subscription.status === 'authorized') {
        console.log('✅ Assinatura AUTORIZADA - Criando pedido');

        // Call convert-proposal-to-order
        const { data: conversionResult, error: conversionError } = await supabase.functions.invoke('convert-proposal-to-order', {
          body: {
            proposalId,
            paymentId: preapprovalId,
            paymentData: {
              method: 'cartao_recorrente',
              subscriptionId: preapprovalId,
              status: subscription.status,
              monthlyValue: subscription.auto_recurring?.transaction_amount,
              frequency: subscription.auto_recurring?.frequency,
              frequencyType: subscription.auto_recurring?.frequency_type
            }
          }
        });

        if (conversionError) {
          console.error('❌ Erro na conversão:', conversionError);
        } else {
          console.log('✅ Conversão realizada:', conversionResult);
          
          // 🔔 Notificar vendedor via EXA Alerts
          try {
            await supabase.functions.invoke('notify-proposal-event', {
              body: {
                proposalId,
                eventType: 'proposal_paid',
                metadata: {
                  paymentMethod: 'Cartão Recorrente',
                  paymentAmount: subscription.auto_recurring?.transaction_amount
                }
              }
            });
            console.log('🔔 EXA Alerts notificado sobre pagamento cartão recorrente');
          } catch (notifyErr) {
            console.error('⚠️ Erro ao notificar EXA Alerts:', notifyErr);
          }
        }

        // Log event
        await supabase.from('log_eventos_sistema').insert({
          tipo_evento: 'ASSINATURA_CARTAO_AUTORIZADA',
          descricao: `Assinatura ${preapprovalId} autorizada para proposta ${proposalId}. Pedido: ${conversionResult?.orderId || 'N/A'}`
        });

      } else if (subscription.status === 'cancelled') {
        console.log('❌ Assinatura CANCELADA');

        // Find and update the order
        const { data: proposal } = await supabase
          .from('proposals')
          .select('converted_order_id')
          .eq('id', proposalId)
          .single();

        if (proposal?.converted_order_id) {
          await supabase
            .from('pedidos')
            .update({ 
              status: 'cancelado',
              status_adimplencia: 'suspenso'
            })
            .eq('id', proposal.converted_order_id);

          console.log('📦 Pedido atualizado para cancelado');
        }

        await supabase.from('log_eventos_sistema').insert({
          tipo_evento: 'ASSINATURA_CARTAO_CANCELADA',
          descricao: `Assinatura ${preapprovalId} cancelada para proposta ${proposalId}`
        });

      } else if (subscription.status === 'paused') {
        console.log('⏸️ Assinatura PAUSADA');

        const { data: proposal } = await supabase
          .from('proposals')
          .select('converted_order_id')
          .eq('id', proposalId)
          .single();

        if (proposal?.converted_order_id) {
          await supabase
            .from('pedidos')
            .update({ status_adimplencia: 'suspenso' })
            .eq('id', proposal.converted_order_id);
        }
      }

    } else if (type === 'authorized_payment') {
      // Handle individual payment within subscription
      const paymentId = data?.id;
      console.log('💳 Payment ID:', paymentId);

      // Fetch payment details
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${mpAccessToken}` }
      });

      if (!mpResponse.ok) {
        console.error('❌ Erro ao buscar pagamento no MP');
        throw new Error('Erro ao buscar pagamento');
      }

      const payment = await mpResponse.json();
      console.log('💰 Pagamento MP:', JSON.stringify(payment, null, 2));

      // Extract proposal ID from external_reference
      const externalReference = payment.external_reference || '';
      
      // Handle subscription payment format
      if (externalReference.startsWith('subscription:')) {
        const proposalId = externalReference.replace('subscription:', '');

        // Find the order
        const { data: proposal } = await supabase
          .from('proposals')
          .select('converted_order_id, duration_months')
          .eq('id', proposalId)
          .single();

        if (proposal?.converted_order_id && payment.status === 'approved') {
          console.log('✅ Pagamento de parcela aprovado');

          // Get current order to determine which installment this is
          const { data: order } = await supabase
            .from('pedidos')
            .select('parcela_atual, total_parcelas')
            .eq('id', proposal.converted_order_id)
            .single();

          if (order) {
            const currentInstallment = order.parcela_atual || 1;

            // Update the installment record
            const { error: parcelaError } = await supabase
              .from('parcelas')
              .update({
                status: 'pago',
                data_pagamento: new Date().toISOString(),
                mercadopago_payment_id: String(paymentId)
              })
              .eq('pedido_id', proposal.converted_order_id)
              .eq('numero_parcela', currentInstallment);

            if (!parcelaError) {
              console.log(`✅ Parcela ${currentInstallment} marcada como paga`);
            }

            // Increment parcela_atual on the order
            await supabase
              .from('pedidos')
              .update({ 
                parcela_atual: currentInstallment + 1,
                status_adimplencia: 'em_dia'
              })
              .eq('id', proposal.converted_order_id);

            await supabase.from('log_eventos_sistema').insert({
              tipo_evento: 'PARCELA_CARTAO_PAGA',
              descricao: `Parcela ${currentInstallment}/${order.total_parcelas} paga via cartão recorrente. Pedido: ${proposal.converted_order_id}`
            });
          }
        }
      }
    }

    console.log('========================================');
    console.log('✅ Webhook processado com sucesso');
    console.log('========================================');

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Erro no webhook:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
