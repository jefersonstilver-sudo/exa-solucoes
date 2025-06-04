
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template HTML ultra-simples e rápido
function createSimpleEmailHTML(userName: string, confirmationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmação de Email - Indexa</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
        <h1 style="color: #7c3aed; text-align: center;">INDEXA</h1>
        <h2 style="color: #333;">Bem-vindo(a), ${userName}!</h2>
        <p style="color: #666; line-height: 1.6;">
          Para ativar sua conta na Indexa, clique no botão abaixo:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}" 
             style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirmar Email
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">
          Se você não criou esta conta, ignore este email.
        </p>
      </div>
    </body>
    </html>
  `;
}

serve(async (req: Request) => {
  const startTime = Date.now();
  console.log('🚀 [EMAIL-HOOK] Iniciando processamento...');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ [EMAIL-HOOK] CORS preflight handled');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log('❌ [EMAIL-HOOK] Método não permitido:', req.method);
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // DIAGNÓSTICO CRÍTICO: Validar se temos a chave do Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    console.log('🔍 [EMAIL-HOOK] Verificando RESEND_API_KEY...');
    console.log('🔍 [EMAIL-HOOK] API Key presente?', !!resendKey);
    console.log('🔍 [EMAIL-HOOK] API Key length:', resendKey ? resendKey.length : 0);
    
    if (!resendKey) {
      console.error('❌ [EMAIL-HOOK] CRÍTICO: RESEND_API_KEY não encontrada nas variáveis de ambiente');
      console.error('❌ [EMAIL-HOOK] Variáveis disponíveis:', Object.keys(Deno.env.toObject()));
      
      return new Response(JSON.stringify({ 
        error: 'RESEND_API_KEY não configurada no ambiente',
        debug: {
          available_vars: Object.keys(Deno.env.toObject()),
          timestamp: new Date().toISOString()
        },
        success: false 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Inicializar Resend APÓS verificar a chave
    const resend = new Resend(resendKey);
    console.log('✅ [EMAIL-HOOK] Resend inicializado com sucesso');

    // Parse do payload
    const payload = await req.text();
    console.log('📦 [EMAIL-HOOK] Payload recebido, tamanho:', payload.length);
    
    let data;
    try {
      data = JSON.parse(payload);
      console.log('✅ [EMAIL-HOOK] JSON parsed com sucesso');
    } catch (parseError) {
      console.error('❌ [EMAIL-HOOK] Erro ao fazer parse do JSON:', parseError);
      throw new Error('Invalid JSON payload');
    }
    
    // Extrair dados necessários
    const user = data?.user;
    const emailData = data?.email_data;
    
    if (!user?.email) {
      console.error('❌ [EMAIL-HOOK] Email do usuário não encontrado');
      throw new Error('User email not found');
    }
    
    if (!emailData?.token_hash) {
      console.error('❌ [EMAIL-HOOK] Token hash não encontrado');
      throw new Error('Token hash not found');
    }
    
    console.log('✅ [EMAIL-HOOK] Dados extraídos:', {
      email: user.email,
      action: emailData.email_action_type,
      hasToken: !!emailData.token_hash,
      elapsed: Date.now() - startTime + 'ms'
    });

    // Only process email confirmation events
    if (emailData.email_action_type !== 'signup') {
      console.log('⚠️ [EMAIL-HOOK] Ignorando evento não-signup:', emailData.email_action_type);
      return new Response(JSON.stringify({ 
        message: 'Event ignored - not a signup',
        success: true 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Gerar URL de confirmação
    const baseUrl = emailData.site_url || Deno.env.get('SUPABASE_URL') || 'https://aakenoljsycyrcrchgxj.supabase.co';
    const redirectTo = emailData.redirect_to || `${baseUrl}/confirmacao`;
    
    const confirmationUrl = `${baseUrl}/auth/v1/verify?token=${emailData.token_hash}&type=${emailData.email_action_type}&redirect_to=${encodeURIComponent(redirectTo)}`;
    
    console.log('🔗 [EMAIL-HOOK] URL de confirmação gerada em', Date.now() - startTime, 'ms');

    // Preparar dados do email
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Cliente';
    const html = createSimpleEmailHTML(userName, confirmationUrl);
    
    console.log('📧 [EMAIL-HOOK] Template HTML criado em', Date.now() - startTime, 'ms');

    // Enviar email usando o domínio verificado indexamidia.com
    const emailStartTime = Date.now();
    
    try {
      console.log('📤 [EMAIL-HOOK] Tentando enviar email para:', user.email);
      console.log('📤 [EMAIL-HOOK] Usando sender: noreply@indexamidia.com');
      
      const { data: emailResponse, error: emailError } = await resend.emails.send({
        from: 'Indexa <noreply@indexamidia.com>',
        to: [user.email],
        subject: '🎯 Confirme seu email na Indexa',
        html,
      });

      if (emailError) {
        console.error('❌ [EMAIL-HOOK] Erro do Resend:', emailError);
        console.error('❌ [EMAIL-HOOK] Tipo do erro:', typeof emailError);
        console.error('❌ [EMAIL-HOOK] Detalhes:', JSON.stringify(emailError, null, 2));
        throw emailError;
      }

      const emailTime = Date.now() - emailStartTime;
      const totalTime = Date.now() - startTime;
      
      console.log('✅ [EMAIL-HOOK] Email enviado com sucesso!', {
        emailId: emailResponse?.id,
        emailTime: emailTime + 'ms',
        totalTime: totalTime + 'ms',
        recipient: user.email
      });

      return new Response(JSON.stringify({ 
        message: 'Email sent successfully',
        email_id: emailResponse?.id,
        processing_time_ms: totalTime,
        recipient: user.email,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (emailError: any) {
      const emailTime = Date.now() - emailStartTime;
      console.error('❌ [EMAIL-HOOK] Falha no envio de email após', emailTime, 'ms');
      console.error('❌ [EMAIL-HOOK] Erro detalhado:', {
        message: emailError.message,
        name: emailError.name,
        statusCode: emailError.statusCode,
        stack: emailError.stack
      });
      
      // FALLBACK: Retornar sucesso mesmo com falha no email
      // O usuário ainda pode se cadastrar, só não receberá o email
      return new Response(JSON.stringify({ 
        message: 'User registered but email failed to send',
        email_error: emailError.message,
        email_error_details: {
          name: emailError.name,
          statusCode: emailError.statusCode,
          message: emailError.message
        },
        processing_time_ms: Date.now() - startTime,
        success: true // Importante: retornar sucesso para não bloquear cadastro
      }), {
        status: 200, // Status 200 para não quebrar o hook
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error('💥 [EMAIL-HOOK] Erro crítico após', totalTime, 'ms:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // FALLBACK CRÍTICO: Sempre retornar 200 para não quebrar o cadastro
    return new Response(JSON.stringify({ 
      message: 'Hook completed with errors but user registration allowed',
      error: error.message,
      processing_time_ms: totalTime,
      success: true // Permitir que o cadastro continue
    }), {
      status: 200, // Status 200 para não quebrar o webhook
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
