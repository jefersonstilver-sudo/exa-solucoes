// ============================================
// ⚠️ FUNÇÃO ATUALIZADA - USA TEMPLATES OFICIAIS
// ============================================
// Esta função agora usa os templates oficiais
// do sistema localizado em /admin/comunicacoes

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import * as EmailTemplates from '../_shared/email-templates/index.ts';
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
    delivery_type?: 'code' | 'link';
    redemption_instructions?: string;
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
      console.log('📧 [BENEFIT-INVITATION] Usando template oficial do sistema');
      
      const { provider_name, provider_email, access_token, activation_point } = data;
      const siteUrl = Deno.env.get('SITE_URL') || 'https://examidia.com.br';
      
      // Validação do SITE_URL
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
        token: access_token.substring(0, 15) + '...'
      });

      // ✅ USAR TEMPLATE OFICIAL
      const html = EmailTemplates.createBenefitInvitationEmail({
        providerName: provider_name,
        providerEmail: provider_email,
        presentLink,
        activationPoint: activation_point
      });

      const result = await resend.emails.send({
        from: "EXA Mídia <noreply@examidia.com.br>",
        to: [provider_email],
        subject: "🎉 Parabéns! Você ajudou a ativar mais um ponto EXA!",
        html,
      });

      console.log("✅ [BENEFIT-INVITATION] Email enviado com sucesso:", result);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (type === "gift_code") {
      console.log('🎁 [BENEFIT-GIFT-CODE] Usando template oficial do sistema');
      
      const { provider_name, provider_email, benefit_choice, gift_code, delivery_type, redemption_instructions } = data;

      // ✅ USAR TEMPLATE OFICIAL
      const html = EmailTemplates.createBenefitGiftCodeEmail({
        providerName: provider_name,
        providerEmail: provider_email,
        benefitChoice: benefit_choice,
        giftCode: gift_code,
        deliveryType: delivery_type || 'code',
        redemptionInstructions: redemption_instructions
      });

      const result = await resend.emails.send({
        from: "EXA Mídia <noreply@examidia.com.br>",
        to: [provider_email],
        subject: "🎁 Aqui está seu presente da EXA!",
        html,
      });

      console.log("✅ [BENEFIT-GIFT-CODE] Email enviado com sucesso:", result);

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

// ============================================
// ❌ FUNÇÕES ANTIGAS REMOVIDAS
// ============================================
// As funções createInvitationHTML e createGiftCodeHTML
// foram removidas. Agora usamos os templates oficiais
// de supabase/functions/_shared/email-templates/
// que são gerenciados pela página /admin/comunicacoes

// Isso garante que:
// ✅ Todos os emails seguem o mesmo padrão visual
// ✅ Mudanças são feitas em um só lugar
// ✅ Templates são versionados e auditados
// ✅ Sistema de customização controlado funciona corretamente
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
  const isLink = deliveryType === 'link';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>Seu Presente EXA</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background-color: #DC2626 !important;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 20px;
    }
    .email-container {
      background-color: #ffffff !important;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .header {
      background: linear-gradient(135deg, #DC2626 0%, #1A1A1A 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo-img {
      width: 120px;
      height: auto;
      display: inline-block;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
      background-color: #ffffff !important;
    }
    h1 {
      color: #DC2626 !important;
      font-size: 28px;
      margin: 0 0 20px 0;
    }
    p {
      color: #333333 !important;
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
      color: #ffffff !important;
      font-size: 18px;
      margin: 0 0 10px 0;
    }
    .choice-box h2 {
      color: #ffffff !important;
      font-size: 32px;
      margin: 0;
    }
    .code-box {
      background-color: #f8f9fa !important;
      border: 3px dashed #DC2626;
      padding: 30px;
      border-radius: 12px;
      margin: 30px 0;
    }
    .code-box p {
      margin: 0 0 15px 0;
      font-weight: 600;
      color: #DC2626 !important;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .code-box h2 {
      margin: 0;
      font-size: 36px;
      color: #1A1A1A !important;
      font-weight: 900;
      letter-spacing: 4px;
      font-family: 'Courier New', monospace;
    }
    .footer {
      background-color: #f8f9fa !important;
      padding: 30px;
      text-align: center;
      color: #718096 !important;
      font-size: 14px;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #DC2626 !important;
      }
      .email-container {
        background-color: #ffffff !important;
      }
      .content {
        background-color: #ffffff !important;
      }
      h1 {
        color: #DC2626 !important;
      }
      p {
        color: #333333 !important;
      }
      .choice-box p {
        color: #ffffff !important;
      }
      .choice-box h2 {
        color: #ffffff !important;
      }
      .code-box {
        background-color: #f8f9fa !important;
      }
      .code-box p {
        color: #DC2626 !important;
      }
      .code-box h2 {
        color: #1A1A1A !important;
      }
      .footer {
        background-color: #f8f9fa !important;
        color: #718096 !important;
      }
    }
  </style>
</head>
<body style="background-color: #DC2626 !important;">
  <div class="container">
    <div class="email-container" style="background-color: #ffffff !important;">
      <div class="header">
        <img src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0" alt="EXA" class="logo-img" style="filter: brightness(0) invert(1);">
      </div>
      <div class="content" style="background-color: #ffffff !important;">
        <h1 style="color: #DC2626 !important;">🎁 Aqui está seu presente, ${name}!</h1>
        <div class="choice-box">
          <p style="color: #ffffff !important;">Você escolheu:</p>
          <h2 style="color: #ffffff !important;">${benefitName}</h2>
        </div>
        <div class="code-box" style="background-color: #f8f9fa !important;">
          <p style="color: #DC2626 !important;">${isLink ? '🔗 Link de Resgate:' : '💳 Código do Presente:'}</p>
          ${isLink ? `<a href="${code}" style="color: #DC2626 !important; text-decoration: underline; word-break: break-all; font-size: 18px; font-weight: 600;">${code}</a>` : `<h2 style="color: #1A1A1A !important;">${code}</h2>`}
        </div>
        ${instructions ? `
        <div style="background-color: #f8f9fa !important; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #DC2626 !important; font-size: 16px;">📝 Como Resgatar:</p>
          <p style="margin: 0; color: #333333 !important; white-space: pre-line;">${instructions}</p>
        </div>
        ` : ''}
        <p style="color: #333333 !important;">Obrigado por fazer parte da <strong>construção da EXA MÍDIA</strong>.</p>
        <p style="color: #333333 !important;">Continue acompanhando as ativações com a gente! 🚀</p>
      </div>
      <div class="footer" style="background-color: #f8f9fa !important;">
        <p style="color: #718096 !important;">© 2025 EXA MÍDIA</p>
        <p style="margin-top: 10px; color: #718096 !important;">Publicidade que vive nos elevadores</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

serve(handler);
