import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmail {
  type: "invitation";
  data: {
    provider_name: string;
    provider_email: string;
    access_token: string;
    activation_point?: string;
  };
}

interface GiftCodeEmail {
  type: "gift_code";
  data: {
    provider_name: string;
    provider_email: string;
    benefit_choice: string;
    gift_code: string;
  };
}

type EmailRequest = InvitationEmail | GiftCodeEmail;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data }: EmailRequest = await req.json();
    console.log(`Processing ${type} email request`);

    if (type === "invitation") {
      const { provider_name, provider_email, access_token, activation_point } = data;
      const siteUrl = Deno.env.get('SITE_URL') || 'https://examidia.com.br';
      
      // Validação e logging do SITE_URL
      if (!siteUrl || siteUrl.includes('undefined') || !siteUrl.startsWith('http')) {
        console.error('❌ SITE_URL inválido:', siteUrl);
        return new Response(
          JSON.stringify({ error: 'Invalid SITE_URL configuration' }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const presentLink = `${siteUrl}/presente?token=${access_token}`;
      
      console.log('✅ Email Configuration:', {
        siteUrl,
        presentLink,
        provider_email,
        token: access_token.substring(0, 15) + '...' // Log parcial por segurança
      });

      const html = createInvitationHTML(provider_name, presentLink, activation_point);

      const result = await resend.emails.send({
        from: "EXA Mídia <noreply@examidia.com.br>",
        to: [provider_email],
        subject: "🎉 Parabéns! Você ajudou a ativar mais um ponto EXA!",
        html,
      });

      console.log("Invitation email sent:", result);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (type === "gift_code") {
      const { provider_name, provider_email, benefit_choice, gift_code } = data;

      const html = createGiftCodeHTML(provider_name, benefit_choice, gift_code);

      const result = await resend.emails.send({
        from: "EXA Mídia <noreply@examidia.com.br>",
        to: [provider_email],
        subject: "🎁 Aqui está seu presente da EXA!",
        html,
      });

      console.log("Gift code email sent:", result);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid email type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-benefit-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

function createInvitationHTML(name: string, link: string, point?: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presente EXA</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #DC2626 0%, #1A1A1A 100%);
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
    }
    .email-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .header {
      background: linear-gradient(135deg, #DC2626 0%, #1A1A1A 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      font-size: 42px;
      font-weight: 900;
      color: white;
      margin: 0;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    h1 {
      color: #DC2626;
      font-size: 28px;
      margin: 0 0 20px 0;
      text-align: center;
    }
    p {
      color: #555;
      font-size: 16px;
      line-height: 1.8;
      margin: 15px 0;
    }
    .highlight {
      background: linear-gradient(135deg, #DC2626 0%, #1A1A1A 100%);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .highlight p {
      color: white;
      font-weight: bold;
      margin: 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #DC2626 0%, #1A1A1A 100%);
      color: #ffffff !important;
      text-decoration: none !important;
      padding: 16px 40px;
      border-radius: 50px;
      font-weight: bold;
      font-size: 18px;
      margin: 20px 0;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #718096;
      font-size: 14px;
    }
    .note {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #DC2626;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-container">
      <div class="header">
        <h1 class="logo">EXA</h1>
      </div>
      <div class="content">
        <h1>🎉 Parabéns, ${name}!</h1>
        <p>A cada painel instalado, a EXA celebra junto de quem esteve no campo!</p>
        ${point ? `<div class="highlight"><p>📍 Ponto ativado: ${point}</p></div>` : ''}
        <p>Você é parte da <strong>revolução da atenção nos condomínios</strong>. Por isso, queremos te agradecer com um presente especial de <strong style="color: #DC2626; font-size: 20px;">R$ 50,00</strong>.</p>
        <div style="text-align: center;">
          <a href="${link}" class="button" style="color: #ffffff !important; text-decoration: none !important;">
            <span style="color: #ffffff !important;">🎁 ESCOLHER MEU PRESENTE</span>
          </a>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
          <p style="font-size: 12px; color: #666; margin: 0 0 10px 0;">
            Ou copie e cole este link no seu navegador:
          </p>
          <p style="font-size: 14px; color: #DC2626; margin: 0; word-break: break-all; font-family: 'Courier New', monospace;">
            ${link}
          </p>
        </div>
        <div class="note">
          <p style="margin: 0;"><strong>⚠️ Importante:</strong> Este link é único e pessoal. Após escolher seu presente, ele não poderá ser usado novamente.</p>
        </div>
      </div>
      <div class="footer">
        <p>© 2025 EXA MÍDIA. Obrigado por fazer parte!</p>
        <p style="margin-top: 10px;">Publicidade que vive nos elevadores 🚀</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function createGiftCodeHTML(name: string, choice: string, code: string): string {
  const benefitNames: Record<string, string> = {
    shopee: "Shopee 🛍️",
    renner: "Renner 👗",
    riachuelo: "Riachuelo 👔",
    havaianas: "Havaianas 🩴",
    arezzo: "Arezzo 👠",
    petz: "Petz 🐾",
    cacau_show: "Cacau Show 🍫",
    mcdonalds: "McDonald's 🍟",
    madero: "Madero 🍔",
    jeronimo: "Jeronimo 🍕",
    ze_delivery: "Zé Delivery 🍺",
    uber: "Uber 🚗",
    spotify: "Spotify 🎧",
    netflix: "Netflix 🎬",
  };

  const benefitName = benefitNames[choice] || choice;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Presente EXA</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #DC2626 0%, #1A1A1A 100%);
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
    }
    .email-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .header {
      background: linear-gradient(135deg, #DC2626 0%, #1A1A1A 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      font-size: 42px;
      font-weight: 900;
      color: white;
      margin: 0;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    h1 {
      color: #DC2626;
      font-size: 28px;
      margin: 0 0 20px 0;
    }
    p {
      color: #555;
      font-size: 16px;
      line-height: 1.8;
      margin: 15px 0;
    }
    .choice-box {
      background: linear-gradient(135deg, #DC2626 0%, #1A1A1A 100%);
      padding: 30px;
      border-radius: 12px;
      margin: 30px 0;
    }
    .choice-box p {
      color: white;
      font-size: 18px;
      margin: 0 0 10px 0;
    }
    .choice-box h2 {
      color: white;
      font-size: 32px;
      margin: 0;
    }
    .code-box {
      background: #f8f9fa;
      border: 3px dashed #DC2626;
      padding: 30px;
      border-radius: 12px;
      margin: 30px 0;
    }
    .code-box p {
      margin: 0 0 15px 0;
      font-weight: 600;
      color: #DC2626;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .code-box h2 {
      margin: 0;
      font-size: 36px;
      color: #333;
      font-weight: 900;
      letter-spacing: 4px;
      font-family: 'Courier New', monospace;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #718096;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-container">
      <div class="header">
        <h1 class="logo">EXA</h1>
      </div>
      <div class="content">
        <h1>🎁 Aqui está seu presente, ${name}!</h1>
        <div class="choice-box">
          <p>Você escolheu:</p>
          <h2>${benefitName}</h2>
        </div>
        <div class="code-box">
          <p>💳 Código do Presente:</p>
          <h2>${code}</h2>
        </div>
        <p>Obrigado por fazer parte da <strong>construção da EXA MÍDIA</strong>.</p>
        <p>Continue acompanhando as ativações com a gente! 🚀</p>
      </div>
      <div class="footer">
        <p>© 2025 EXA MÍDIA</p>
        <p style="margin-top: 10px;">Publicidade que vive nos elevadores</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

serve(handler);
