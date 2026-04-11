// ============================================
// NOTIFICAR VENDEDOR - PROPOSTA ACEITA
// Envia Email + WhatsApp (EXA Alerts) quando cliente aceita proposta
// ============================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png';

interface NotifySellerRequest {
  proposalId: string;
  selectedPlan: 'avista' | 'fidelidade';
  paymentMethod?: 'pix' | 'boleto';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, selectedPlan, paymentMethod } = await req.json() as NotifySellerRequest;

    console.log('🔔 [NOTIFY-SELLER-ACCEPTED] Iniciando notificação para vendedor:', { proposalId, selectedPlan, paymentMethod });

    if (!proposalId) {
      throw new Error('proposalId é obrigatório');
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

    const planLabel = selectedPlan === 'avista' ? 'À Vista' : 'Fidelidade';
    const selectedValue = selectedPlan === 'avista' 
      ? proposal.cash_total_value 
      : (proposal.fidel_monthly_value * proposal.duration_months);

    // ========== 1. SEND EMAIL TO SELLER ==========
    if (sellerEmail) {
      console.log('📧 Enviando email para vendedor:', sellerEmail);

      const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Aceita - EXA Mídia</title>
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
          <p style="color: #166534; font-size: 24px; margin: 0 0 8px 0;">🎉</p>
          <p style="color: #166534; font-size: 18px; font-weight: 600; margin: 0;">
            Parabéns, ${sellerName.split(' ')[0]}!
          </p>
        </div>
        
        <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px; text-align: center;">
          Seu cliente <strong>${proposal.client_name}</strong> aceitou a proposta!
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
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Plano:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${planLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Pagamento:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'boleto' ? 'Boleto' : 'Não definido'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Valor:</strong></td>
              <td style="padding: 8px 0; text-align: right; font-size: 16px; color: #8B1A1A; font-weight: 700;">${formatCurrency(selectedValue)}</td>
            </tr>
          </table>
        </div>

        <p style="color: #6B7280; font-size: 13px; text-align: center; margin: 24px 0 0 0;">
          O cliente receberá o email de confirmação com os dados para pagamento.
        </p>
        
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
          subject: `🎉 Proposta ${proposal.number} ACEITA - ${proposal.client_name}`,
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

    // ========== 2. SEND WHATSAPP VIA EXA ALERTS ==========
    if (sellerPhone) {
      console.log('📱 Enviando WhatsApp para vendedor via EXA Alerts:', sellerPhone);

      // Format phone number
      const cleanPhone = sellerPhone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const whatsappMessage = `🎉 *PROPOSTA ACEITA!*

Parabéns, ${sellerName.split(' ')[0]}!

Seu cliente *${proposal.client_name}* aceitou a proposta.

📋 *Detalhes:*
• Proposta: ${proposal.number}
• Plano: ${planLabel}
• Pagamento: ${paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'boleto' ? 'Boleto' : 'Não definido'}
• Valor: ${formatCurrency(selectedValue)}

O cliente receberá os dados para pagamento.

_EXA Mídia - Vendas_`;

      try {
        // Send via EXA Alerts agent (same pattern as escalations)
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

    // ========== 3. LOG THE ACTION ==========
    await supabase.from('proposal_logs').insert({
      proposal_id: proposalId,
      action: 'vendedor_notificado_aceitacao',
      details: {
        seller_name: sellerName,
        seller_email: sellerEmail,
        seller_phone: sellerPhone,
        selected_plan: selectedPlan,
        payment_method: paymentMethod,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ [NOTIFY-SELLER-ACCEPTED] Notificações enviadas com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Vendedor notificado com sucesso',
        sellerEmail,
        sellerPhone
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [NOTIFY-SELLER-ACCEPTED] Erro:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
