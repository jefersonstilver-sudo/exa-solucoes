
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { EmailService } from "./_utils/emailService.ts";
import { LinkGenerator } from "./_utils/linkGenerator.ts";
import { validateAndCorrectUrl } from "./_utils/urlValidator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  console.log('🔄 [RESEND-EMAIL] Iniciando reenvio de email...');
  
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

    // Verificar API key do Resend
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

    // Inicializar serviços
    const emailService = new EmailService(resendKey);
    const linkGenerator = new LinkGenerator(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Gerar link de confirmação
    const confirmationUrl = await linkGenerator.generateConfirmationLink(email);

    // Configurar URLs
    const currentUrl = new URL(req.url);
    let baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    baseUrl = validateAndCorrectUrl(baseUrl);
    
    const correctedUrl = confirmationUrl.replace(
      /redirect_to=[^&]+/,
      `redirect_to=${encodeURIComponent(baseUrl + '/confirmacao')}`
    );

    const finalUrl = validateAndCorrectUrl(correctedUrl);

    console.log('✅ [RESEND-EMAIL] URLs configuradas:');
    console.log('   - Base URL:', baseUrl);
    console.log('   - URL final:', finalUrl);

    // Enviar email
    const userName = email.split('@')[0];
    const { data: emailData, error: emailError } = await emailService.sendResendConfirmationEmail(
      email, 
      userName, 
      finalUrl
    );

    if (emailError) {
      console.error('❌ [RESEND-EMAIL] Erro ao enviar:', emailError);
      throw emailError;
    }

    console.log('✅ [RESEND-EMAIL] Email reenviado com sucesso!');

    return new Response(JSON.stringify({ 
      message: 'Email reenviado com sucesso!',
      email_id: emailData?.id,
      confirmation_url: finalUrl,
      base_url: baseUrl,
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
