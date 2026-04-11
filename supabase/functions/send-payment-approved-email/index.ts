import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Logo oficial da EXA
const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, orderId, clientEmail, clientName, passwordResetLink } = await req.json();

    console.log('📧 [PAYMENT-APPROVED-EMAIL] Enviando para:', clientEmail);
    console.log('📧 [PAYMENT-APPROVED-EMAIL] Password link recebido:', !!passwordResetLink);

    if (!clientEmail) {
      throw new Error('clientEmail é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados da proposta
    let proposalData = null;
    let ccEmails: string[] = [];
    
    if (proposalId) {
      const { data } = await supabase
        .from('proposals')
        .select('*, cc_emails')
        .eq('id', proposalId)
        .single();
      proposalData = data;
      ccEmails = data?.cc_emails || [];
    }

    const firstName = clientName?.split(' ')[0] || 'Cliente';
    const proposalNumber = proposalData?.number || 'N/A';
    const duration = proposalData?.duration_months || 1;
    const totalPanels = proposalData?.total_panels || 0;
    
    // Calcular valor baseado no tipo de pagamento
    let value = proposalData?.cash_total_value || proposalData?.fidel_monthly_value || 0;
    const isCustomPayment = proposalData?.payment_type === 'custom';
    const customInstallments = proposalData?.custom_installments || [];
    
    // Para pagamentos personalizados, mostrar valor da primeira parcela
    if (isCustomPayment && customInstallments.length > 0) {
      value = Number(customInstallments[0]?.amount || 0);
    }

    // ✅ CORREÇÃO: Verificar se precisa de link de acesso
    const needsAccessLink = !!passwordResetLink;
    const accessSection = needsAccessLink ? `
      <!-- Password Setup Section - CRITICAL -->
      <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px; padding: 28px; margin: 28px 0; color: white; text-align: center;">
        <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 700;">
          🔐 Configure sua Senha
        </h3>
        <p style="margin: 0 0 20px; font-size: 14px; opacity: 0.95; line-height: 1.6;">
          Para acessar sua conta e enviar seu vídeo, clique no botão abaixo:
        </p>
        <a href="${passwordResetLink}" 
           style="display: inline-block; background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);">
          Definir Senha e Acessar →
        </a>
        <p style="margin: 16px 0 0; font-size: 12px; opacity: 0.8;">
          Este link expira em 24 horas
        </p>
      </div>
    ` : `
      <!-- Access Button for existing users -->
      <div style="text-align: center; margin: 36px 0;">
        <a href="https://examidia.com.br/anunciante/meus-pedidos" 
           style="display: inline-block; background: linear-gradient(135deg, #8B1A1A 0%, #A52020 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 16px rgba(139, 26, 26, 0.3);">
          Acessar Minha Conta →
        </a>
      </div>
    `;

    // Template HTML com header vermelho EXA - Estilo corporativo profissional
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>Pagamento Aprovado - EXA Mídia</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f7;
      color: #333333;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 48px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(139, 26, 26, 0.12);">
          
          <!-- HEADER VERMELHO EXA - GRADIENTE PROFISSIONAL -->
          <tr>
            <td style="background: linear-gradient(135deg, #8B1A1A 0%, #A52020 100%); padding: 56px 48px; text-align: center;">
              <img src="${EXA_LOGO_URL}" alt="EXA Mídia" style="max-width: 180px; height: auto; display: block; margin: 0 auto 24px; filter: brightness(0) invert(1); drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));">
              <h1 style="font-size: 28px; font-weight: 800; color: #ffffff; margin: 0 0 12px; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); letter-spacing: -0.5px;">
                🎉 Pagamento Aprovado!
              </h1>
              <p style="font-size: 15px; font-weight: 500; color: rgba(255, 255, 255, 0.95); margin: 0; letter-spacing: 0.3px;">
                Sua transação foi confirmada com sucesso
              </p>
            </td>
          </tr>
          
          <!-- CONTENT -->
          <tr>
            <td style="padding: 48px;">
              
              <!-- Greeting -->
              <h2 style="font-size: 26px; font-weight: 800; color: #333333; margin: 0 0 24px; line-height: 1.3;">
                Parabéns, ${firstName}!
              </h2>
              
              <p style="font-size: 16px; line-height: 1.75; color: #666666; margin: 0 0 28px;">
                Seu pagamento foi processado e aprovado. Agora você pode enviar seu vídeo publicitário e começar a anunciar nos painéis digitais da EXA!
              </p>
              
              <!-- Order Summary Box -->
              <div style="background: linear-gradient(135deg, #F9F9F9 0%, #F5F5F5 100%); border-left: 4px solid #8B1A1A; padding: 24px 28px; margin: 28px 0; border-radius: 12px;">
                <h3 style="font-size: 14px; font-weight: 700; color: #8B1A1A; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.5px;">
                  📋 Resumo do Contrato
                </h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Proposta:</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">#${proposalNumber}</td>
                  </tr>
                  ${orderId ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Pedido:</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">#${orderId.slice(0, 8).toUpperCase()}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Duração:</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">${duration} ${duration === 1 ? 'mês' : 'meses'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666; font-size: 14px;">Telas contratadas:</td>
                    <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right; font-weight: 600;">${totalPanels} telas</td>
                  </tr>
                  <tr style="border-top: 1px solid #E5E5E5;">
                    <td style="padding: 16px 0 8px; color: #333333; font-size: 16px; font-weight: 600;">
                      ${isCustomPayment ? 'Valor desta parcela:' : 'Valor pago:'}
                    </td>
                    <td style="padding: 16px 0 8px; color: #22C55E; font-size: 20px; text-align: right; font-weight: 700;">
                      R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </table>
                ${isCustomPayment && customInstallments.length > 1 ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #DDD;">
                  <p style="font-size: 13px; color: #666; margin: 0;">
                    <strong>Próximas parcelas:</strong> Você tem ${customInstallments.length - 1} parcela(s) restante(s).
                  </p>
                </div>
                ` : ''}
              </div>
              
              ${accessSection}
              
              <!-- Next Steps Box -->
              <div style="background: linear-gradient(135deg, #8B1A1A 0%, #A52020 100%); border-radius: 12px; padding: 24px 28px; margin: 28px 0; color: white;">
                <h3 style="margin: 0 0 16px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                  🚀 Próximos Passos
                </h3>
                <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 2;">
                  ${needsAccessLink ? '<li>Clique no botão acima e defina sua senha</li>' : '<li>Acesse sua conta na plataforma EXA</li>'}
                  <li>Envie seu vídeo publicitário (até 10 segundos, formato horizontal 4:3)</li>
                  <li>Aguarde a aprovação (em até 24h úteis)</li>
                  <li>Seu anúncio começará a rodar automaticamente!</li>
                </ol>
              </div>
              
              <!-- Support -->
              <p style="margin: 28px 0 0; font-size: 14px; color: #666666; text-align: center;">
                Dúvidas? Entre em contato pelo WhatsApp:<br>
                <a href="https://wa.me/5545991415856" style="color: #8B1A1A; text-decoration: none; font-weight: 600;">
                  (45) 99141-5856
                </a>
              </p>
              
            </td>
          </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(180deg, #FAFAFA 0%, #F5F5F5 100%); padding: 40px 48px; text-align: center; border-top: 1px solid #E5E5E5;">
              <p style="font-size: 18px; font-weight: 900; color: #8B1A1A; margin: 0 0 8px; letter-spacing: 0.5px; text-transform: uppercase;">
                EXA
              </p>
              <p style="font-size: 13px; color: #666666; margin: 0 0 24px; font-weight: 500;">
                Publicidade Inteligente em Painéis Digitais
              </p>
              <p style="font-size: 12px; color: #999999; margin: 0;">
                © ${new Date().getFullYear()} EXA Mídia - Todos os direitos reservados<br>
                Foz do Iguaçu, PR - Brasil
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    console.log('📤 Enviando email para:', clientEmail);
    console.log('📤 CC emails:', ccEmails.length > 0 ? ccEmails : 'Nenhum');
    
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'EXA Mídia <noreply@examidia.com.br>',
      to: [clientEmail],
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      subject: `🎉 Pagamento Aprovado - Proposta #${proposalNumber}`,
      html: htmlContent,
    });

    if (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      
      // ✅ AUDITORIA: Registrar falha
      await supabase.from('email_audit_log').insert({
        email_type: 'payment_approved',
        recipient_email: clientEmail,
        recipient_name: clientName,
        status: 'failed',
        error_message: emailError.message || String(emailError),
        related_entity_type: 'proposal',
        related_entity_id: proposalId,
        metadata: {
          order_id: orderId,
          proposal_number: proposalNumber,
          value_paid: value,
          is_custom_payment: isCustomPayment,
          has_password_link: needsAccessLink
        }
      });
      
      throw emailError;
    }

    console.log('✅ Email de pagamento aprovado enviado:', emailResult);

    // ✅ AUDITORIA: Registrar sucesso
    await supabase.from('email_audit_log').insert({
      email_type: 'payment_approved',
      recipient_email: clientEmail,
      recipient_name: clientName,
      resend_email_id: emailResult?.id,
      status: 'sent',
      related_entity_type: 'proposal',
      related_entity_id: proposalId,
      metadata: {
        order_id: orderId,
        proposal_number: proposalNumber,
        value_paid: value,
        is_custom_payment: isCustomPayment,
        has_password_link: needsAccessLink
      }
    });

    // Log no banco (proposal_logs - mantido para compatibilidade)
    if (proposalId) {
      await supabase.from('proposal_logs').insert({
        proposal_id: proposalId,
        action: 'email_pagamento_aprovado_enviado',
        details: {
          email: clientEmail,
          email_id: emailResult?.id,
          order_id: orderId,
          value_paid: value,
          is_custom_payment: isCustomPayment,
          has_password_link: needsAccessLink,
          timestamp: new Date().toISOString()
        }
      });
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResult?.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erro em send-payment-approved-email:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
