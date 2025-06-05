
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { EmailService } from "./_utils/emailService.ts";
import { validateAndCorrectUrl } from "./_utils/urlValidator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    
    const emailService = new EmailService(resendKey);

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

    // Enviar email
    const { data: emailResponse, error: emailError } = await emailService.sendConfirmationEmail(
      user.email, 
      userName, 
      validatedConfirmationUrl
    );

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
