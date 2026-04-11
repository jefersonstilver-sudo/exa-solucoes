// ============================================
// NOTIFICAR VENDEDOR - PAGAMENTO CONFIRMADO
// Envia EXA Alert + Email quando cliente paga a proposta
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png';

interface NotifyPaymentRequest {
  proposalId: string;
  orderId: string;
  paymentAmount: number;
  paymentMethod: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, orderId, paymentAmount, paymentMethod } = await req.json() as NotifyPaymentRequest;

    console.log('💰 [NOTIFY-SELLER-PAYMENT] Iniciando notificação de pagamento:', { proposalId, orderId, paymentAmount });

    if (!proposalId || !orderId) {
      throw new Error('proposalId e orderId são obrigatórios');
    }

    // Initialize clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }
    const resend = new Resend(resendApiKey);

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

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Pedido não encontrado: ${orderError?.message}`);
    }

    console.log('✅ Pedido encontrado:', order.id);

    // Fetch seller info
    let sellerName = 'Vendedor';
    let sellerEmail = '';
    let sellerPhone = '';

    if (proposal.created_by) {
      const { data: userData } = await supabase
        .from('users')
        .select('nome, email, telefone')
        .eq('id', proposal.created_by)
        .single();
      
      if (userData) {
        sellerName = userData.nome || 'Vendedor';
        sellerEmail = userData.email || '';
        sellerPhone = userData.telefone || '';
      }
    }

    const formatCurrency = (value: number) => {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const formattedAmount = formatCurrency(paymentAmount || order.valor_total || 0);

    // ========== 1. SEND EXA ALERT (WHATSAPP) TO SELLER ==========
    if (sellerPhone) {
      console.log('📱 Enviando EXA Alert de pagamento para vendedor:', sellerPhone);

      const cleanPhone = sellerPhone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const whatsappMessage = `💰 *PAGAMENTO CONFIRMADO!*

${sellerName.split(' ')[0]}, ótimas notícias!

O cliente *${proposal.client_name}* realizou o pagamento.

📋 *Detalhes:*
• Proposta: ${proposal.number}
• Valor: *${formattedAmount}*
• Método: ${paymentMethod === 'pix' ? 'PIX' : 'Boleto'}
• Pedido: #${orderId.slice(0, 8)}

✅ O pedido foi criado automaticamente no sistema EXA.

_EXA Mídia - Vendas_`;

      try {
        const { data: agent } = await supabase
          .from('agents')
          .select('zapi_config')
          .eq('key', 'exa_alertas')
          .single();

        if (agent?.zapi_config) {
          const zapiConfig = agent.zapi_config as { instance_id?: string; token?: string };
          const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

          if (zapiConfig.instance_id && zapiConfig.token && zapiClientToken) {
            const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;

            const zapiResponse = await fetch(zapiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Client-Token': zapiClientToken,
              },
              body: JSON.stringify({
                phone: formattedPhone,
                message: whatsappMessage,
              }),
            });

            const zapiResult = await zapiResponse.json();
            console.log('📱 Resposta Z-API:', zapiResult);
          }
        }
      } catch (whatsappErr) {
        console.error('❌ Exceção ao enviar WhatsApp:', whatsappErr);
      }
    }

    // ========== 2. SEND EMAIL TO SELLER ==========
    if (sellerEmail) {
      console.log('📧 Enviando email de pagamento para vendedor:', sellerEmail);

      const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Confirmado - EXA Mídia</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  
  <div style="width: 100%; background-color: #f5f5f5; padding: 40px 20px;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);">
      
      <!-- Header -->
      <div style="background-color: #ffffff; padding: 32px; text-align: center; border-bottom: 1px solid #f0f0f0;">
        <img src="${EXA_LOGO_URL}" alt="EXA Mídia" style="height: 48px; width: auto; display: block; margin: 0 auto;" />
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 32px; background-color: #ffffff;">
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
          <p style="color: #166534; font-size: 24px; margin: 0 0 8px 0;">💰</p>
          <p style="color: #166534; font-size: 18px; font-weight: 600; margin: 0;">
            Pagamento Confirmado!
          </p>
        </div>
        
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px; text-align: center;">
          ${sellerName.split(' ')[0]}, o cliente <strong>${proposal.client_name}</strong> realizou o pagamento!
        </p>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; font-size: 14px; color: #4B5563; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Proposta:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${proposal.number}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Cliente:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${proposal.client_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Método:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${paymentMethod === 'pix' ? 'PIX' : 'Boleto'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Pedido:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">#${orderId.slice(0, 8)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Valor Pago:</strong></td>
              <td style="padding: 8px 0; text-align: right; font-size: 18px; color: #059669; font-weight: 700;">${formattedAmount}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #166534; font-size: 13px; margin: 0; text-align: center;">
            ✅ O pedido foi criado automaticamente no sistema EXA.<br>
            O cliente receberá o acesso à plataforma em breve.
          </p>
        </div>
        
      </div>
      
      <!-- Footer -->
      <div style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #f0f0f0;">
        <p style="color: #8B1A1A; font-size: 13px; font-weight: 600; margin: 0 0 4px;">EXA Mídia</p>
        <p style="color: #D1D5DB; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} EXA Mídia</p>
      </div>
      
    </div>
  </div>
  
</body>
</html>
      `;

      try {
        const { data: emailResponse, error: emailError } = await resend.emails.send({
          from: 'EXA Mídia <comercial@examidia.com.br>',
          to: [sellerEmail],
          subject: `💰 Pagamento Confirmado - ${proposal.client_name} - ${formattedAmount}`,
          html: emailHtml,
        });

        if (emailError) {
          console.error('❌ Erro ao enviar email para vendedor:', emailError);
        } else {
          console.log('✅ Email enviado para vendedor:', emailResponse);
        }
      } catch (emailErr) {
        console.error('❌ Exceção ao enviar email:', emailErr);
      }
    }

    // ========== 3. LOG THE ACTION ==========
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'vendedor_notificado_pagamento',
      details: {
        seller_name: sellerName,
        seller_email: sellerEmail,
        seller_phone: sellerPhone,
        order_id: orderId,
        payment_amount: paymentAmount,
        payment_method: paymentMethod,
        timestamp: new Date().toISOString()
      }
    });

    // Also log to system events
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'VENDEDOR_NOTIFICADO_PAGAMENTO',
      descricao: `Vendedor ${sellerName} notificado sobre pagamento de ${formattedAmount} do cliente ${proposal.client_name}`
    });

    console.log('✅ [NOTIFY-SELLER-PAYMENT] Notificações enviadas com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Vendedor notificado sobre pagamento',
        sellerEmail,
        sellerPhone
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [NOTIFY-SELLER-PAYMENT] Erro:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
