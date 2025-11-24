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

serve(handler);
