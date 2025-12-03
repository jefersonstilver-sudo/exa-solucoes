import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, orderId, clientEmail, clientName } = await req.json();

    console.log('📧 [PAYMENT-APPROVED-EMAIL] Enviando para:', clientEmail);

    if (!clientEmail) {
      throw new Error('clientEmail é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados da proposta
    let proposalData = null;
    if (proposalId) {
      const { data } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();
      proposalData = data;
    }

    const firstName = clientName?.split(' ')[0] || 'Cliente';
    const proposalNumber = proposalData?.number || 'N/A';
    const duration = proposalData?.duration_months || 1;
    const totalPanels = proposalData?.total_panels || 0;
    const value = proposalData?.cash_total_value || proposalData?.fidel_monthly_value || 0;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Aprovado - EXA Mídia</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <img src="https://examidia.com.br/logo-exa.png" alt="EXA Mídia" width="120" style="margin-bottom: 20px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px; color: white;">✓</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">
                🎉 Parabéns, ${firstName}!
              </h1>
              <p style="margin: 10px 0 0; font-size: 18px; color: #6b7280;">
                Seu pagamento foi aprovado com sucesso!
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              
              <!-- Order Summary -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                  📋 Resumo do Contrato
                </h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Proposta:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; text-align: right; font-weight: 600;">#${proposalNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Duração:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; text-align: right; font-weight: 600;">${duration} ${duration === 1 ? 'mês' : 'meses'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Telas contratadas:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; text-align: right; font-weight: 600;">${totalPanels} telas</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="padding: 16px 0 8px; color: #1a1a1a; font-size: 16px; font-weight: 600;">Valor pago:</td>
                    <td style="padding: 16px 0 8px; color: #10B981; font-size: 20px; text-align: right; font-weight: 700;">
                      R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Next Steps -->
              <div style="background: linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; color: white;">
                <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  🚀 Próximos Passos
                </h2>
                <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                  <li>Acesse sua conta na plataforma EXA</li>
                  <li>Envie seu vídeo publicitário (formato vertical)</li>
                  <li>Aguarde a aprovação (em até 24h úteis)</li>
                  <li>Seu anúncio começará a rodar automaticamente!</li>
                </ol>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://examidia.com.br/login" 
                   style="display: inline-block; background: linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(156, 30, 30, 0.4);">
                  Acessar Plataforma →
                </a>
              </div>
              
              <!-- Support -->
              <p style="margin: 24px 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                Dúvidas? Entre em contato pelo WhatsApp:<br>
                <a href="https://wa.me/5545991415856" style="color: #9C1E1E; text-decoration: none; font-weight: 600;">
                  (45) 99141-5856
                </a>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} EXA Mídia. Todos os direitos reservados.<br>
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

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'EXA Mídia <noreply@examidia.com.br>',
      to: [clientEmail],
      subject: `🎉 Pagamento Aprovado - Proposta #${proposalNumber}`,
      html: htmlContent,
    });

    if (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      throw emailError;
    }

    console.log('✅ Email de pagamento aprovado enviado:', emailResult);

    // Log no banco
    if (proposalId) {
      await supabase.from('proposal_logs').insert({
        proposal_id: proposalId,
        action: 'email_pagamento_aprovado_enviado',
        details: {
          email: clientEmail,
          email_id: emailResult?.id,
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
