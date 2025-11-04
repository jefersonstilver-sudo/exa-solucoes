
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { EmailService } from "./email-service.ts";
import { URLValidator } from "./url-validator.ts";
import { LinkGenerator } from "./link-generator.ts";
import { RateLimiter } from "./rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Main Handler
serve(async (req: Request) => {
  console.log('🚀 [UNIFIED-EMAIL] Requisição recebida:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { action, email, user, email_data } = await req.json();
    
    console.log('📦 [UNIFIED-EMAIL] Dados recebidos:', { action, email: email || user?.email });

    // Verificar API key do Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('❌ [UNIFIED-EMAIL] RESEND_API_KEY não configurada');
      return new Response(JSON.stringify({ 
        error: 'RESEND_API_KEY não configurada',
        success: false 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const emailService = new EmailService(resendKey);
    
    // Detectar URLs dinamicamente
    const currentUrl = new URL(req.url);
    let baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    baseUrl = URLValidator.validateAndCorrectUrl(baseUrl);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://aakenoljsycyrcrchgxj.supabase.co';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!serviceRoleKey) {
      console.error('❌ [UNIFIED-EMAIL] SUPABASE_SERVICE_ROLE_KEY não configurada');
      return new Response(JSON.stringify({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY não configurada',
        success: false 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Roteamento baseado na ação
    if (action === 'resend') {
      // REENVIO DE EMAIL DE CONFIRMAÇÃO
      if (!email) {
        return new Response(JSON.stringify({ 
          error: 'Email é obrigatório para reenvio',
          success: false 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Rate limiting
      if (!RateLimiter.checkLimit(email)) {
        return new Response(JSON.stringify({ 
          error: 'Muitas tentativas. Aguarde alguns minutos.',
          success: false 
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      console.log('🔄 [UNIFIED-EMAIL] Reenviando confirmação para:', email);

      const linkGenerator = new LinkGenerator(supabaseUrl, serviceRoleKey);
      // Para reenvios, sempre gerar um novo token (não usar token original)
      const confirmationUrl = await linkGenerator.generateConfirmationLink(email);

      const userName = email.split('@')[0];
      const { data: emailData, error: emailError } = await emailService.sendResendConfirmationEmail(
        email, 
        userName, 
        URLValidator.validateAndCorrectUrl(confirmationUrl)
      );

      if (emailError) {
        console.error('❌ [UNIFIED-EMAIL] Erro ao reenviar:', emailError);
        throw emailError;
      }

      console.log('✅ [UNIFIED-EMAIL] Email reenviado com sucesso!');

      return new Response(JSON.stringify({ 
        message: 'Email reenviado com sucesso!',
        email_id: emailData?.id,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } else if (action === 'recovery' || email_data?.email_action_type === 'recovery') {
      // RECUPERAÇÃO DE SENHA
      const userEmail = user?.email || email;
      
      if (!userEmail) {
        return new Response(JSON.stringify({ 
          error: 'Email é obrigatório para recuperação',
          success: false 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (!email_data?.token_hash) {
        return new Response(JSON.stringify({ 
          error: 'Token de recuperação não encontrado',
          success: false 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      console.log('🔒 [UNIFIED-EMAIL] Enviando email de recuperação para:', userEmail);

      // Construir URL de recuperação
      const recoveryUrl = `${baseUrl}/auth/confirm?token_hash=${email_data.token_hash}&type=recovery&next=/reset-password`;
      
      const userName = user?.user_metadata?.name || userEmail.split('@')[0];
      const { data: emailData, error: emailError } = await emailService.sendPasswordRecoveryEmail(
        userEmail, 
        userName, 
        URLValidator.validateAndCorrectUrl(recoveryUrl)
      );

      if (emailError) {
        console.error('❌ [UNIFIED-EMAIL] Erro ao enviar recuperação:', emailError);
        throw emailError;
      }

      console.log('✅ [UNIFIED-EMAIL] Email de recuperação enviado com sucesso!');

      return new Response(JSON.stringify({ 
        message: 'Email de recuperação enviado com sucesso',
        email_id: emailData?.id,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } else {
      // EMAIL DE CONFIRMAÇÃO INICIAL (webhook do Supabase)
      if (!user?.email) {
        throw new Error('User email not found');
      }
      
      if (!email_data?.token_hash) {
        throw new Error('Token hash not found');
      }

      // Processar apenas eventos de signup
      if (email_data.email_action_type !== 'signup') {
        console.log('⚠️ [UNIFIED-EMAIL] Ignorando evento:', email_data.email_action_type);
        return new Response(JSON.stringify({ 
          message: 'Event ignored - not a signup confirmation',
          success: true 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      console.log('📧 [UNIFIED-EMAIL] Enviando confirmação inicial para:', user.email);

      // ESTRATÉGIA HÍBRIDA: Usar LinkGenerator para links mais duráveis
      const linkGenerator = new LinkGenerator(supabaseUrl, serviceRoleKey);
      const redirectUrl = `${baseUrl}/confirmacao`;
      console.log('🎯 [UNIFIED-EMAIL] URL de redirect definida:', redirectUrl);
      
      // Tentar extrair token original do webhook se disponível
      const originalToken = email_data?.access_token || email_data?.confirmation_url?.match(/access_token=([^&]+)/)?.[1];
      console.log('🔍 [UNIFIED-EMAIL] Token original detectado:', !!originalToken);
      
      let confirmationUrl;
      try {
        // Usar LinkGenerator que é mais robusto contra expiração
        confirmationUrl = await linkGenerator.generateConfirmationLink(user.email, originalToken, redirectUrl);
        console.log('✅ [UNIFIED-EMAIL] URL de confirmação construída via LinkGenerator:', {
          baseUrl,
          redirectTo: redirectUrl,
          hasOriginalToken: !!originalToken,
          fullUrl: confirmationUrl
        });
      } catch (linkGenError) {
        console.warn('⚠️ [UNIFIED-EMAIL] LinkGenerator falhou, usando método tradicional:', linkGenError);
        // Fallback para método tradicional se LinkGenerator falhar
        console.log('🌐 [UNIFIED-EMAIL] URL base detectada para fallback:', baseUrl);
        confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=signup&redirect_to=${encodeURIComponent(redirectUrl)}`;
        
        console.log('✅ [UNIFIED-EMAIL] URL de confirmação construída via fallback:', {
          baseUrl,
          redirectTo: redirectUrl,
          tokenHashLength: email_data.token_hash?.length || 0,
          fullUrl: confirmationUrl
        });
      }
      
      const validatedUrl = URLValidator.validateAndCorrectUrl(confirmationUrl);
      
      console.log('🔗 [UNIFIED-EMAIL] URL final de confirmação:', validatedUrl);

      const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Cliente';

      const { data: emailData, error: emailError } = await emailService.sendConfirmationEmail(
        user.email, 
        userName, 
        validatedUrl
      );

      if (emailError) {
        console.error('❌ [UNIFIED-EMAIL] Erro ao enviar:', emailError);
        throw emailError;
      }

      console.log('✅ [UNIFIED-EMAIL] Email inicial enviado com sucesso!');

      return new Response(JSON.stringify({ 
        message: 'Email de confirmação enviado com sucesso',
        email_id: emailData?.id,
        recipient: user.email,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

  } catch (error: any) {
    console.error('💥 [UNIFIED-EMAIL] Erro:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro ao processar email',
      message: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
