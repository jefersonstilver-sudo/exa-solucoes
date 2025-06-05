
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template HTML idêntico ao da função principal
function createConfirmationEmailHTML(userName: string, confirmationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirme seu Email - Indexa</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .logo { text-align: center; color: #7c3aed; font-size: 32px; font-weight: bold; margin-bottom: 30px; }
        .button { background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 20px 0; }
        .footer { color: #999; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">INDEXA</div>
        <h2>Bem-vindo(a), ${userName}!</h2>
        <p>Obrigado por se cadastrar na Indexa! Para ativar sua conta e começar a anunciar, confirme seu email clicando no botão abaixo:</p>
        <div style="text-align: center;">
          <a href="${confirmationUrl}" class="button">
            ✅ Confirmar Email
          </a>
        </div>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; background: #f8f8f8; padding: 10px; border-radius: 5px; font-size: 12px;">
          ${confirmationUrl}
        </p>
        <div class="footer">
          <p>Se você não criou esta conta, pode ignorar este email.</p>
          <p>Este link expira em 24 horas por segurança.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req: Request) => {
  console.log('🔄 [RESEND-EMAIL] Iniciando reenvio de email...');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email é obrigatório',
        success: false 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('📧 [RESEND-EMAIL] Reenviando para:', email);

    // Verificar se temos a chave do Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('❌ [RESEND-EMAIL] RESEND_API_KEY não encontrada');
      return new Response(JSON.stringify({ 
        error: 'RESEND_API_KEY não configurada',
        success: false 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const resend = new Resend(resendKey);

    // Inicializar cliente Supabase admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Gerar novo link de confirmação via Supabase Admin
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
    });

    if (linkError) {
      console.error('❌ [RESEND-EMAIL] Erro ao gerar link:', linkError);
      throw linkError;
    }

    const confirmationUrl = linkData.properties?.action_link;
    if (!confirmationUrl) {
      throw new Error('Link de confirmação não foi gerado');
    }

    // CORREÇÃO: Detectar automaticamente o domínio atual
    const currentUrl = new URL(req.url);
    const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    
    // Modificar URL para usar domínio atual
    const correctedUrl = confirmationUrl.replace(
      /redirect_to=[^&]+/,
      `redirect_to=${encodeURIComponent(baseUrl + '/confirmacao')}`
    );

    console.log('✅ [RESEND-EMAIL] Link gerado e corrigido para domínio atual');
    console.log('🔗 [RESEND-EMAIL] Base URL detectada:', baseUrl);

    // Enviar email
    const userName = email.split('@')[0];
    const html = createConfirmationEmailHTML(userName, correctedUrl);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Indexa <noreply@indexamidia.com>',
      to: [email],
      subject: '🎯 Confirme seu email na Indexa (Reenviado)',
      html,
    });

    if (emailError) {
      console.error('❌ [RESEND-EMAIL] Erro ao enviar:', emailError);
      throw emailError;
    }

    console.log('✅ [RESEND-EMAIL] Email reenviado com sucesso!');

    return new Response(JSON.stringify({ 
      message: 'Email reenviado com sucesso!',
      email_id: emailData?.id,
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('💥 [RESEND-EMAIL] Erro:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro ao reenviar email',
      message: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
