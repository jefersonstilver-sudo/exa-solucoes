
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
        <h2 style="color: #333;">Confirmação de Email</h2>
        <p style="color: #666; line-height: 1.6;">
          Clique no botão abaixo para confirmar seu email:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}" 
             style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirmar Email
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">
          Se você não solicitou este email, ignore esta mensagem.
        </p>
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

    console.log('✅ [RESEND-EMAIL] Link gerado com sucesso');

    // Enviar email
    const userName = email.split('@')[0];
    const html = createSimpleEmailHTML(userName, confirmationUrl);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Indexa <onboarding@resend.dev>',
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
