import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXA_LOGO_URL = 'https://examidia.com.br/logo.png';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      pedidoId, 
      clientEmail, 
      clientName, 
      buildingsCount, 
      panelsCount, 
      durationMonths,
      isNewUser,
      passwordResetLink 
    } = await req.json();

    console.log('[send-cortesia-welcome-email] Enviando para:', clientEmail);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const resend = new Resend(resendApiKey);

    // Template HTML minimalista Apple-style
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à EXA Mídia</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #2d1515 100%); border-radius: 16px 16px 0 0; padding: 32px;">
          <tr>
            <td align="center">
              <div style="display: inline-block; background: #9C1E1E; padding: 12px 24px; border-radius: 12px; margin-bottom: 16px;">
                <span style="color: white; font-size: 24px; font-weight: 700;">🎁 EXA</span>
              </div>
              <h1 style="color: white; font-size: 28px; font-weight: 600; margin: 0;">
                Você recebeu uma cortesia!
              </h1>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 40px 32px;">
          <tr>
            <td>
              <p style="color: #1d1d1f; font-size: 18px; margin: 0 0 24px 0;">
                Olá <strong>${clientName.split(' ')[0]}</strong>!
              </p>

              <p style="color: #6e6e73; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Você ganhou uma cortesia de anúncio em elevadores! Seu anúncio será exibido para milhares de pessoas diariamente.
              </p>

              <!-- Stats -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f7; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <tr>
                  <td align="center" width="33%">
                    <div style="color: #9C1E1E; font-size: 28px; font-weight: 700;">${buildingsCount}</div>
                    <div style="color: #6e6e73; font-size: 13px; margin-top: 4px;">📍 Prédios</div>
                  </td>
                  <td align="center" width="33%">
                    <div style="color: #9C1E1E; font-size: 28px; font-weight: 700;">${panelsCount}</div>
                    <div style="color: #6e6e73; font-size: 13px; margin-top: 4px;">📺 Telas</div>
                  </td>
                  <td align="center" width="33%">
                    <div style="color: #9C1E1E; font-size: 28px; font-weight: 700;">${durationMonths}</div>
                    <div style="color: #6e6e73; font-size: 13px; margin-top: 4px;">📅 ${durationMonths === 1 ? 'Mês' : 'Meses'}</div>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e5e7; margin: 32px 0;">

              <!-- Instructions -->
              <h2 style="color: #1d1d1f; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
                Próximos Passos
              </h2>

              ${isNewUser ? `
              <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                  <span style="background: #22c55e; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">1</span>
                  <div>
                    <div style="color: #166534; font-weight: 600; font-size: 14px; margin-bottom: 4px;">Ative sua conta</div>
                    <div style="color: #15803d; font-size: 13px;">Clique no botão abaixo para criar sua senha de acesso.</div>
                  </div>
                </div>
              </div>
              ` : ''}

              <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                  <span style="background: #9C1E1E; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${isNewUser ? '2' : '1'}</span>
                  <div>
                    <div style="color: #1d1d1f; font-weight: 600; font-size: 14px; margin-bottom: 4px;">Envie seu vídeo</div>
                    <div style="color: #6e6e73; font-size: 13px;">
                      • Até <strong>15 segundos</strong><br>
                      • Formato <strong>horizontal</strong> (16:9)<br>
                      • <strong>Sem som</strong> (os elevadores são silenciosos)
                    </div>
                  </div>
                </div>
              </div>

              <div style="background: #f5f5f7; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                  <span style="background: #9C1E1E; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${isNewUser ? '3' : '2'}</span>
                  <div>
                    <div style="color: #1d1d1f; font-weight: 600; font-size: 14px; margin-bottom: 4px;">Aguarde a aprovação</div>
                    <div style="color: #6e6e73; font-size: 13px;">Após enviar, analisamos seu vídeo e ele entra em exibição automaticamente!</div>
                  </div>
                </div>
              </div>

              <!-- CTA Button -->
              ${isNewUser && passwordResetLink ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${passwordResetLink}" style="display: inline-block; background: linear-gradient(135deg, #9C1E1E 0%, #7a1717 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                      Ativar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>
              ` : `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://examidia.com.br/anunciante" style="display: inline-block; background: linear-gradient(135deg, #9C1E1E 0%, #7a1717 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                      Acessar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>
              `}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f7; border-radius: 0 0 16px 16px; padding: 24px 32px;">
          <tr>
            <td align="center">
              <p style="color: #86868b; font-size: 13px; margin: 0 0 8px 0;">
                Dúvidas? Estamos aqui para ajudar!
              </p>
              <p style="color: #6e6e73; font-size: 13px; margin: 0;">
                contato@examidia.com.br • (45) 99809-0000
              </p>
              <p style="color: #86868b; font-size: 11px; margin: 16px 0 0 0;">
                © ${new Date().getFullYear()} EXA Mídia. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Enviar email
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'EXA Mídia <contato@examidia.com.br>',
      to: clientEmail,
      subject: '🎁 Você recebeu uma cortesia de anúncio - EXA Mídia',
      html: htmlContent
    });

    if (emailError) {
      console.error('[send-cortesia-welcome-email] Erro Resend:', emailError);
      throw emailError;
    }

    console.log('[send-cortesia-welcome-email] Email enviado:', emailResult?.id);

    return new Response(JSON.stringify({
      success: true,
      emailId: emailResult?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[send-cortesia-welcome-email] Erro:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
