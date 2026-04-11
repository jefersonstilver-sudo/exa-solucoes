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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { clientEmail, clientName, passwordResetLink, orderId, isNewUser } = await req.json();

    console.log('📧 [WELCOME-EMAIL] Enviando para:', clientEmail);
    console.log('📧 [WELCOME-EMAIL] isNewUser:', isNewUser);

    if (!clientEmail || !passwordResetLink) {
      throw new Error('clientEmail e passwordResetLink são obrigatórios');
    }

    const firstName = clientName?.split(' ')[0] || 'Cliente';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à EXA Mídia</title>
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
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🎬</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">
                Bem-vindo à EXA Mídia!
              </h1>
              <p style="margin: 10px 0 0; font-size: 18px; color: #6b7280;">
                Olá, ${firstName}! Sua conta foi criada com sucesso.
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              
              <!-- Welcome Message -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #374151;">
                  🏢 Sua publicidade em elevadores começa agora!
                </h2>
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                  Criamos uma conta para você na plataforma EXA Mídia. 
                  Agora você pode gerenciar suas campanhas, enviar vídeos e 
                  acompanhar o desempenho dos seus anúncios em tempo real.
                </p>
              </div>
              
              <!-- Password Setup -->
              <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; color: white; text-align: center;">
                <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600;">
                  🔐 Configure sua senha
                </h2>
                <p style="margin: 0 0 20px; font-size: 14px; opacity: 0.9;">
                  Clique no botão abaixo para definir sua senha e acessar a plataforma:
                </p>
                <a href="${passwordResetLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #9C1E1E 0%, #7D1818 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(156, 30, 30, 0.4);">
                  Definir Minha Senha →
                </a>
                <p style="margin: 16px 0 0; font-size: 12px; opacity: 0.7;">
                  Este link expira em 24 horas
                </p>
              </div>
              
              <!-- What's Next -->
              <div style="margin-bottom: 24px;">
                <h2 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #374151;">
                  📋 Após criar sua senha:
                </h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 32px; vertical-align: top;">
                            <div style="width: 24px; height: 24px; background-color: #9C1E1E; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">1</div>
                          </td>
                          <td style="padding-left: 12px;">
                            <p style="margin: 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">Acesse a plataforma</p>
                            <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Faça login com seu email e senha</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 32px; vertical-align: top;">
                            <div style="width: 24px; height: 24px; background-color: #9C1E1E; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">2</div>
                          </td>
                          <td style="padding-left: 12px;">
                            <p style="margin: 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">Envie seu vídeo</p>
                            <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Formato horizontal (4:3), até 10 segundos</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="width: 32px; vertical-align: top;">
                            <div style="width: 24px; height: 24px; background-color: #10B981; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">✓</div>
                          </td>
                          <td style="padding-left: 12px;">
                            <p style="margin: 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">Pronto!</p>
                            <p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">Após aprovação, seu anúncio começa a rodar</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Support -->
              <div style="background-color: #fef3f2; border-radius: 12px; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #9C1E1E;">
                  <strong>Precisa de ajuda?</strong><br>
                  Nossa equipe está pronta para te ajudar!
                </p>
                <a href="https://wa.me/5545991415856" 
                   style="display: inline-block; margin-top: 12px; color: #9C1E1E; text-decoration: none; font-weight: 600; font-size: 14px;">
                  💬 WhatsApp: (45) 99141-5856
                </a>
              </div>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} EXA Mídia. Todos os direitos reservados.<br>
                Foz do Iguaçu, PR - Brasil
              </p>
              <p style="margin: 12px 0 0; font-size: 11px; color: #d1d5db;">
                Você recebeu este email porque acabou de se tornar cliente da EXA Mídia.
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
      subject: `🎬 Bem-vindo à EXA Mídia! Configure sua conta`,
      html: htmlContent,
    });

    if (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      
      // Registrar FALHA na auditoria
      await supabase.from('email_audit_log').insert({
        email_type: 'welcome',
        recipient_email: clientEmail,
        recipient_name: clientName,
        status: 'failed',
        error_message: emailError.message || String(emailError),
        related_entity_type: orderId ? 'order' : null,
        related_entity_id: orderId || null,
        metadata: {
          is_new_user: isNewUser,
          has_password_link: true
        }
      });
      
      throw emailError;
    }

    console.log('✅ Email de boas-vindas enviado:', emailResult);

    // ✅ AUDITORIA: Registrar email enviado com sucesso
    await supabase.from('email_audit_log').insert({
      email_type: 'welcome',
      recipient_email: clientEmail,
      recipient_name: clientName,
      resend_email_id: emailResult?.id,
      status: 'sent',
      related_entity_type: orderId ? 'order' : null,
      related_entity_id: orderId || null,
      metadata: {
        is_new_user: isNewUser,
        has_password_link: true
      }
    });

    return new Response(JSON.stringify({ success: true, emailId: emailResult?.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Erro em send-welcome-email:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
