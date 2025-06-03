
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template HTML otimizado e simples
function createEmailHTML(userName: string, confirmationUrl: string, userEmail: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo à Indexa</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .email-card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); }
        .header { padding: 40px; text-align: center; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); }
        .logo { color: white; font-size: 24px; font-weight: bold; margin: 0; }
        .content { padding: 40px; text-align: center; }
        .title { font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 0 0 16px; }
        .text { font-size: 16px; line-height: 1.6; color: #374151; margin: 0 0 24px; }
        .button { display: inline-block; background-color: #7c3aed; color: white; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 8px; margin: 24px 0; }
        .button:hover { background-color: #6d28d9; }
        .footer { padding: 24px 40px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb; }
        .footer-text { font-size: 12px; color: #6b7280; margin: 0; }
        .benefits { text-align: left; margin: 24px 0; }
        .benefit { margin: 12px 0; font-size: 14px; color: #374151; }
        @media screen and (max-width: 480px) { .container { padding: 10px; } .content, .header, .footer { padding: 20px; } .title { font-size: 24px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="email-card">
          <div class="header">
            <h1 class="logo">INDEXA</h1>
          </div>
          <div class="content">
            <h1 class="title">🎉 Bem-vindo(a), ${userName}!</h1>
            <p class="text">Estamos muito felizes em ter você conosco! Para ativar sua conta e começar a anunciar nos melhores painéis digitais do Brasil, confirme seu email:</p>
            <a href="${confirmationUrl}" class="button">✅ Confirmar Email e Ativar Conta</a>
            <div class="benefits">
              <div class="benefit">🏢 <strong>Painéis em prédios premium</strong> - Alcance milhares de pessoas</div>
              <div class="benefit">📱 <strong>Campanhas inteligentes</strong> - Tecnologia de ponta</div>
              <div class="benefit">📊 <strong>Relatórios em tempo real</strong> - Acompanhe sua performance</div>
              <div class="benefit">💰 <strong>Melhor custo-benefício</strong> - Publicidade acessível</div>
            </div>
            <p class="text" style="font-size: 14px; color: #6b7280;">Se você não criou uma conta na Indexa, ignore este email.</p>
          </div>
          <div class="footer">
            <p class="footer-text">Este email foi enviado para ${userEmail}</p>
            <p class="footer-text">© 2024 Indexa - Transformando a publicidade exterior</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req: Request) => {
  const startTime = Date.now();
  console.log('🔐 EMAIL CONFIRMATION HOOK - Starting...');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const payload = await req.text();
    console.log('📦 Processing webhook payload... (', Date.now() - startTime, 'ms)');
    
    const data = JSON.parse(payload);
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url }
    } = data;

    console.log('✅ Webhook data parsed:', {
      email: user?.email,
      action_type: email_action_type,
      has_token: !!token,
      elapsed: Date.now() - startTime + 'ms'
    });

    // Only process email confirmation events
    if (email_action_type !== 'signup') {
      console.log('⚠️ Skipping non-signup event:', email_action_type);
      return new Response(JSON.stringify({ message: 'Event ignored' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Generate the confirmation URL
    const confirmationUrl = `${site_url || Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || site_url + '/confirmacao'}`;

    console.log('🔗 Generated confirmation URL (', Date.now() - startTime, 'ms)');

    // Create optimized HTML email (much faster than React rendering)
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Cliente';
    const html = createEmailHTML(userName, confirmationUrl, user?.email);

    console.log('📧 Email template created (', Date.now() - startTime, 'ms)');

    // Send the email with optimized performance
    const { data: emailData, error } = await resend.emails.send({
      from: 'Indexa <noreply@indexamidia.com>',
      to: [user.email],
      subject: '🎯 Confirme seu email na Indexa - Bem-vindo(a)!',
      html,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }

    const totalTime = Date.now() - startTime;
    console.log('✅ Email sent successfully in', totalTime, 'ms - ID:', emailData?.id);

    return new Response(JSON.stringify({ 
      message: 'Email sent successfully',
      email_id: emailData?.id,
      processing_time_ms: totalTime
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error('💥 Error in send-confirmation-email function after', totalTime, 'ms:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      processing_time_ms: totalTime,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
