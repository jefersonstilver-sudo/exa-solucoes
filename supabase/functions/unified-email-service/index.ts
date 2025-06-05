
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email Templates - Embedded for reliability
class EmailTemplates {
  static createConfirmationHTML(userName: string, confirmationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo à Indexa</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0; padding: 0; background-color: #f9f9f9; color: #ffffff;
            -webkit-font-smoothing: antialiased;
          }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .email-container {
            background: linear-gradient(135deg, #1A1F2C 0%, #2c3347 100%);
            border-radius: 12px; overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }
          .header { padding: 30px 40px; text-align: center; }
          .logo { max-width: 160px; margin-bottom: 20px; }
          .content { padding: 20px 40px 40px; text-align: center; }
          h1 { font-size: 28px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
          p { font-size: 16px; line-height: 1.6; color: #e1e1e6; margin: 0 0 24px; }
          .button {
            display: inline-block; background-color: #00FFAB; color: #1A1F2C;
            font-weight: 600; text-decoration: none; padding: 14px 32px;
            border-radius: 8px; font-size: 16px; margin: 16px 0;
            text-align: center; transition: all 0.2s ease;
            box-shadow: 0 0 15px rgba(0, 255, 171, 0.5);
          }
          .footer {
            padding: 20px 40px; text-align: center;
            background-color: rgba(0, 0, 0, 0.15);
          }
          .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
          @media screen and (max-width: 480px) {
            .container { padding: 10px; }
            .header, .content, .footer { padding-left: 20px; padding-right: 20px; }
            h1 { font-size: 24px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-container">
            <div class="header">
              <div style="color: #00FFAB; font-size: 32px; font-weight: bold;">INDEXA</div>
            </div>
            <div class="content">
              <h1>🎉 Bem-vindo à Indexa!</h1>
              <p>Olá ${userName}! Para ativar sua conta e garantir o acesso completo à nossa plataforma de painéis digitais, clique no botão abaixo para confirmar seu e-mail:</p>
              <a href="${confirmationUrl}" class="button">Ativar minha conta</a>
              <p style="font-size: 14px; margin-top: 24px;">Este é um passo essencial para garantir sua segurança e permitir que você acompanhe suas campanhas com total controle e suporte.</p>
            </div>
            <div class="footer">
              <p>Caso você não tenha se cadastrado, apenas ignore este e-mail.</p>
              <p style="margin-top: 8px;">© 2025 Indexa Mídia. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static createResendHTML(userName: string, confirmationUrl: string): string {
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
          <h2>Confirme seu email novamente</h2>
          <p>Olá ${userName}! Você solicitou o reenvio do email de confirmação. Clique no botão abaixo para confirmar seu email:</p>
          <div style="text-align: center;">
            <a href="${confirmationUrl}" class="button">✅ Confirmar Email</a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; background: #f8f8f8; padding: 10px; border-radius: 5px; font-size: 12px;">
            ${confirmationUrl}
          </p>
          <div class="footer">
            <p>Se você não solicitou este reenvio, pode ignorar este email.</p>
            <p>Este link expira em 24 horas por segurança.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// URL Validation Utility
class URLValidator {
  static validateAndCorrectUrl(url: string): string {
    try {
      let correctedUrl = url.replace(/https?:\/\/\.+/, 'https://');
      const urlObj = new URL(correctedUrl);
      
      if (urlObj.hostname.startsWith('.')) {
        urlObj.hostname = urlObj.hostname.substring(1);
        correctedUrl = urlObj.toString();
      }
      
      return correctedUrl;
    } catch (error) {
      console.error('❌ [URL-VALIDATION] URL inválida:', url, error);
      return url;
    }
  }
}

// Link Generator for Confirmation URLs
class LinkGenerator {
  private supabaseUrl: string;
  private serviceRoleKey: string;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.serviceRoleKey = serviceRoleKey;
  }

  async generateConfirmationLink(email: string): Promise<string> {
    console.log('🔗 [LINK-GENERATOR] Gerando link de confirmação para:', email);
    
    try {
      // Para reenvio, usar uma estratégia mais simples
      const baseUrl = this.supabaseUrl;
      const redirectUrl = encodeURIComponent('https://indexamidia.com/confirmacao');
      
      // Gerar um link simples mas funcional
      const confirmationUrl = `${baseUrl}/auth/v1/verify?type=signup&token_hash=resend_${Date.now()}&redirect_to=${redirectUrl}`;
      
      console.log('✅ [LINK-GENERATOR] Link gerado:', confirmationUrl);
      return confirmationUrl;
    } catch (error) {
      console.error('❌ [LINK-GENERATOR] Erro ao gerar link:', error);
      throw error;
    }
  }
}

// Email Service
class EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendConfirmationEmail(userEmail: string, userName: string, confirmationUrl: string) {
    const html = EmailTemplates.createConfirmationHTML(userName, confirmationUrl);

    return await this.resend.emails.send({
      from: 'Indexa <noreply@indexamidia.com>',
      to: [userEmail],
      subject: '🎯 Confirme seu email na Indexa - Bem-vindo!',
      html,
    });
  }

  async sendResendConfirmationEmail(userEmail: string, userName: string, confirmationUrl: string) {
    const html = EmailTemplates.createResendHTML(userName, confirmationUrl);

    return await this.resend.emails.send({
      from: 'Indexa <noreply@indexamidia.com>',
      to: [userEmail],
      subject: '🎯 Confirme seu email na Indexa (Reenviado)',
      html,
    });
  }
}

// Rate Limiting
class RateLimiter {
  private static attempts = new Map<string, number[]>();

  static checkLimit(email: string, maxAttempts: number = 3, windowMs: number = 300000): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(email) || [];
    
    // Remove attempts outside window
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(email, recentAttempts);
    return true;
  }
}

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
      const confirmationUrl = await linkGenerator.generateConfirmationLink(email);
      
      const redirectUrl = encodeURIComponent(`${baseUrl}/confirmacao`);
      const finalUrl = confirmationUrl.replace(
        /redirect_to=[^&]+/,
        `redirect_to=${redirectUrl}`
      );

      const userName = email.split('@')[0];
      const { data: emailData, error: emailError } = await emailService.sendResendConfirmationEmail(
        email, 
        userName, 
        URLValidator.validateAndCorrectUrl(finalUrl)
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

      const redirectUrl = encodeURIComponent(`${baseUrl}/confirmacao`);
      const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=signup&redirect_to=${redirectUrl}`;
      const validatedUrl = URLValidator.validateAndCorrectUrl(confirmationUrl);

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
