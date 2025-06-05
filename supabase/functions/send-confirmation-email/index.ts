
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template HTML otimizado
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

// Função para validar e corrigir URLs malformadas
function validateAndCorrectUrl(url: string): string {
  try {
    // Remover qualquer ponto no início do hostname
    let correctedUrl = url.replace(/https?:\/\/\.+/, 'https://');
    
    // Verificar se é uma URL válida
    const urlObj = new URL(correctedUrl);
    
    // Se o hostname começar com ponto, corrigir
    if (urlObj.hostname.startsWith('.')) {
      urlObj.hostname = urlObj.hostname.substring(1);
      correctedUrl = urlObj.toString();
    }
    
    return correctedUrl;
  } catch (error) {
    console.error('❌ [URL-VALIDATION] URL inválida:', url, error);
    return url; // Retorna original se não conseguir corrigir
  }
}

serve(async (req: Request) => {
  console.log('🚀 [EMAIL-CONFIRMATION] Função iniciada');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    // Verificar se temos a chave do Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.error('❌ [EMAIL-CONFIRMATION] RESEND_API_KEY não encontrada');
      return new Response(JSON.stringify({ 
        error: 'RESEND_API_KEY não configurada',
        success: false 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const resend = new Resend(resendKey);

    // Parse do payload
    const data = await req.json();
    console.log('📦 [EMAIL-CONFIRMATION] Dados recebidos:', {
      hasUser: !!data?.user,
      hasEmailData: !!data?.email_data,
      userEmail: data?.user?.email,
      actionType: data?.email_data?.email_action_type
    });
    
    const user = data?.user;
    const emailData = data?.email_data;
    
    if (!user?.email) {
      throw new Error('User email not found');
    }
    
    if (!emailData?.token_hash) {
      throw new Error('Token hash not found');
    }

    // IMPORTANTE: Processar apenas eventos de signup
    if (emailData.email_action_type !== 'signup') {
      console.log('⚠️ [EMAIL-CONFIRMATION] Ignorando evento:', emailData.email_action_type);
      return new Response(JSON.stringify({ 
        message: 'Event ignored - not a signup confirmation',
        success: true 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // CORREÇÃO ROBUSTA: Detectar e validar o domínio atual
    const currentUrl = new URL(req.url);
    let baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
    
    // Validar e corrigir URL se necessário
    baseUrl = validateAndCorrectUrl(baseUrl);
    
    // URLs de fallback para garantir funcionamento
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://aakenoljsycyrcrchgxj.supabase.co';
    
    // Construir URL de confirmação com validação extra
    const redirectUrl = encodeURIComponent(`${baseUrl}/confirmacao`);
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${emailData.token_hash}&type=signup&redirect_to=${redirectUrl}`;
    
    // Log detalhado para debug
    console.log('🔗 [EMAIL-CONFIRMATION] Configuração de URLs:');
    console.log('   - Request URL:', req.url);
    console.log('   - Base URL detectada:', baseUrl);
    console.log('   - Redirect URL:', `${baseUrl}/confirmacao`);
    console.log('   - URL de confirmação final:', confirmationUrl);
    
    // Validação final da URL de confirmação
    const validatedConfirmationUrl = validateAndCorrectUrl(confirmationUrl);
    
    // Preparar dados do email
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Cliente';
    const html = createConfirmationEmailHTML(userName, validatedConfirmationUrl);

    // Enviar email usando domínio verificado
    const { data: emailResponse, error: emailError } = await resend.emails.send({
      from: 'Indexa <noreply@indexamidia.com>',
      to: [user.email],
      subject: '🎯 Confirme seu email na Indexa - Bem-vindo!',
      html,
    });

    if (emailError) {
      console.error('❌ [EMAIL-CONFIRMATION] Erro do Resend:', emailError);
      throw emailError;
    }

    console.log('✅ [EMAIL-CONFIRMATION] Email enviado com SUCESSO!');
    console.log('✅ [EMAIL-CONFIRMATION] ID do email:', emailResponse?.id);

    return new Response(JSON.stringify({ 
      message: 'Email de confirmação enviado com sucesso',
      email_id: emailResponse?.id,
      recipient: user.email,
      confirmation_url: validatedConfirmationUrl,
      base_url: baseUrl,
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('💥 [EMAIL-CONFIRMATION] Erro:', error);
    
    return new Response(JSON.stringify({ 
      message: 'Erro ao enviar email de confirmação',
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
