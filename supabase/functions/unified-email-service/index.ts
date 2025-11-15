import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { EmailService } from "./email-service.ts";
import { URLValidator } from "./url-validator.ts";
import { LinkGenerator } from "./link-generator.ts";
import { RateLimiter } from "./rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  console.log('📧 [UNIFIED-EMAIL] === INÍCIO ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Importar e validar entrada
    const { validateEmailRequest } = await import('./validation.ts');
    const validatedData = validateEmailRequest(body);
    
    const { action, email, user, email_data } = validatedData;
    
    console.log('📦 Ação:', action, 'Email:', email || user?.email);

    // Verificar configurações
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://aakenoljsycyrcrchgxj.supabase.co';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!resendKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
    }

    const emailService = new EmailService(resendKey, supabaseUrl, serviceRoleKey);
    
    const siteUrl = Deno.env.get('SITE_URL') || 'https://examidia.com.br';
    let baseUrl = siteUrl;
    
    if (!Deno.env.get('SITE_URL')) {
      const currentUrl = new URL(req.url);
      baseUrl = URLValidator.validateAndCorrectUrl(`${currentUrl.protocol}//${currentUrl.host}`);
    }

    // Roteamento baseado na ação
    if (action === 'resend') {
      // REENVIO DE CONFIRMAÇÃO
      if (!email) {
        throw new Error('Email é obrigatório');
      }

      if (!RateLimiter.checkLimit(email)) {
        return new Response(JSON.stringify({ 
          error: 'Muitas tentativas. Aguarde.',
          success: false 
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      console.log('🔗 [1/5] Gerando link de confirmação...');
      const linkGenerator = new LinkGenerator(supabaseUrl, serviceRoleKey);
      const confirmationUrl = await linkGenerator.generateConfirmationLink(email);
      console.log('✅ [1/5] Link gerado');
      
      console.log('👤 [2/5] Buscando nome do usuário...');
      // Buscar nome real do usuário no banco de dados
      let userName = email.split('@')[0]; // fallback
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        
        // Buscar na tabela users primeiro (mais rápido)
        const { data: userData } = await supabase
          .from('users')
          .select('nome, id')
          .eq('email', email)
          .single();
        
        if (userData?.nome) {
          userName = userData.nome;
          console.log(`✅ [2/5] Nome encontrado: ${userName}`);
        } else if (userData?.id) {
          // Se não tem nome na users, buscar na profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome, name, full_name')
            .eq('id', userData.id)
            .single();
          
          if (profile) {
            userName = profile.nome || profile.name || profile.full_name || userName;
            console.log(`✅ [2/5] Nome encontrado: ${userName}`);
          }
        }
        
        if (!userData?.nome && !userData?.id) {
          console.log(`⚠️ [2/5] Usuário não encontrado no banco, usando fallback: ${userName}`);
        }
      } catch (error) {
        console.error('⚠️ [2/5] Erro ao buscar nome:', error);
      }
      
      console.log('📧 [3/5] Gerando e enviando email...');

      const { data: emailData, error: emailError } = await emailService.sendResendConfirmationEmail(
        email, 
        userName, 
        URLValidator.validateAndCorrectUrl(confirmationUrl)
      );

      if (emailError) {
        console.error('❌ [4/5] Erro ao enviar email:', emailError);
        throw emailError;
      }
      
      console.log(`✅ [4/5] Email enviado para Resend - ID: ${emailData?.id}`);
      console.log(`✅ [5/5] Processo completo!`);

      return new Response(JSON.stringify({
        message: 'Email reenviado',
        email_id: emailData?.id,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } else if (action === 'recovery' || email_data?.email_action_type === 'recovery') {
      // RECUPERAÇÃO DE SENHA
      const userEmail = user?.email || email;
      
      if (!userEmail || !email_data?.token_hash) {
        throw new Error('Email e token são obrigatórios');
      }

      const recoveryUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=recovery&redirect_to=${encodeURIComponent(`${baseUrl}/reset-password`)}`;
      const userName = user?.user_metadata?.name || userEmail.split('@')[0];
      
      const { data: emailData, error: emailError } = await emailService.sendPasswordRecoveryEmail(
        userEmail, 
        userName, 
        URLValidator.validateAndCorrectUrl(recoveryUrl)
      );

      if (emailError) throw emailError;

      return new Response(JSON.stringify({ 
        message: 'Email de recuperação enviado',
        email_id: emailData?.id,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } else if (action === 'video_submitted' || action === 'video_approved' || action === 'video_rejected') {
      // NOTIFICAÇÕES DE VÍDEO (novo formato com logging)
      const userEmail = validatedData.recipient_email || user?.email;
      const userName = validatedData.recipient_name || user?.user_metadata?.name || userEmail?.split('@')[0] || 'Cliente';
      const videoTitle = validatedData.video_title || validatedData.video_data?.video_title || 'Seu Vídeo';
      const orderId = validatedData.pedido_id || validatedData.video_data?.order_id;
      const userId = validatedData.user_id;
      const videoId = validatedData.video_id;

      if (!userEmail) {
        throw new Error('Email do usuário é obrigatório');
      }

      console.log(`📧 Notificação (${action}):`, userEmail);

      let emailData, emailError;

      if (action === 'video_submitted') {
        ({ data: emailData, error: emailError } = await emailService.sendVideoSubmittedEmail(
          userEmail,
          userName,
          videoTitle,
          orderId,
          userId,
          videoId
        ));
      } else if (action === 'video_approved') {
        const buildings = validatedData.buildings || validatedData.video_data?.buildings || [];
        const startDate = validatedData.start_date || validatedData.video_data?.start_date || new Date().toLocaleDateString('pt-BR');
        const endDate = validatedData.end_date || validatedData.video_data?.end_date || new Date().toLocaleDateString('pt-BR');
        
        ({ data: emailData, error: emailError } = await emailService.sendVideoApprovedEmail(
          userEmail,
          userName,
          videoTitle,
          buildings,
          startDate,
          endDate,
          orderId,
          userId,
          videoId
        ));
      } else if (action === 'video_rejected') {
        const rejectionReason = validatedData.rejection_reason || validatedData.video_data?.rejection_reason || 'Não especificado';
        
        ({ data: emailData, error: emailError } = await emailService.sendVideoRejectedEmail(
          userEmail,
          userName,
          videoTitle,
          rejectionReason,
          orderId,
          userId,
          videoId
        ));
      }

      if (emailError) throw emailError;

      console.log(`✅ ${action} enviado!`);

      return new Response(JSON.stringify({ 
        message: `Email de ${action} enviado`,
        email_id: emailData?.id,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } else {
      // EMAIL DE CONFIRMAÇÃO INICIAL (webhook)
      console.log('📧 [WEBHOOK] Processando confirmação inicial...');
      console.log('📧 [WEBHOOK] User email:', user?.email);
      console.log('📧 [WEBHOOK] Email action type:', email_data?.email_action_type);
      console.log('🔍 [WEBHOOK] Dados recebidos:', JSON.stringify({
        has_token_hash: !!email_data?.token_hash,
        has_access_token: !!email_data?.access_token,
        has_confirmation_url: !!email_data?.confirmation_url,
        confirmation_url: email_data?.confirmation_url
      }));
      
      if (!user?.email) {
        console.error('❌ [WEBHOOK] Email do usuário faltando');
        throw new Error('User email é obrigatório');
      }
      
      if (email_data?.email_action_type !== 'signup') {
        console.log(`⏭️ [WEBHOOK] Evento ignorado (tipo: ${email_data?.email_action_type})`);
        return new Response(JSON.stringify({ 
          message: 'Event ignored',
          success: true 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const redirectUrl = `${baseUrl}/confirmacao`;
      let confirmationUrl;
      
      // ESTRATÉGIA 1: Usar confirmation_url do webhook se disponível
      if (email_data?.confirmation_url) {
        console.log('✅ [WEBHOOK] Usando confirmation_url do webhook');
        // Atualizar o redirect_to na URL
        const url = new URL(email_data.confirmation_url);
        url.searchParams.set('redirect_to', redirectUrl);
        confirmationUrl = url.toString();
      }
      // ESTRATÉGIA 2: Tentar LinkGenerator com access_token
      else {
        console.log('🔗 [WEBHOOK] Tentando gerar link via LinkGenerator...');
        const linkGenerator = new LinkGenerator(supabaseUrl, serviceRoleKey);
        const originalToken = email_data?.access_token;
        
        try {
          confirmationUrl = await linkGenerator.generateConfirmationLink(user.email, originalToken);
          console.log('✅ [WEBHOOK] Link gerado via LinkGenerator');
        } catch (linkGenError) {
          console.warn('⚠️ [WEBHOOK] Falha no LinkGenerator:', linkGenError);
          
          // ESTRATÉGIA 3: Fallback com token_hash se disponível
          if (email_data?.token_hash) {
            console.log('🔄 [WEBHOOK] Usando fallback com token_hash');
            confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${email_data.token_hash}&type=signup&redirect_to=${encodeURIComponent(redirectUrl)}`;
          } else {
            console.error('❌ [WEBHOOK] Sem token disponível para fallback!');
            throw new Error('Não foi possível gerar link de confirmação - tokens não disponíveis');
          }
        }
      }
      
      console.log('🔗 [WEBHOOK] Link de confirmação gerado:', confirmationUrl.substring(0, 100) + '...');
      
      const validatedUrl = URLValidator.validateAndCorrectUrl(confirmationUrl);
      const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Cliente';

      console.log('📧 [WEBHOOK] Enviando email para:', user.email);
      const { data: emailData, error: emailError } = await emailService.sendConfirmationEmail(
        user.email, 
        userName, 
        validatedUrl
      );

      if (emailError) {
        console.error('❌ [WEBHOOK] Erro ao enviar email:', emailError);
        throw emailError;
      }

      console.log('✅ [WEBHOOK] Email enviado com sucesso! ID:', emailData?.id);

      return new Response(JSON.stringify({ 
        message: 'Email de confirmação enviado',
        email_id: emailData?.id,
        recipient: user.email,
        success: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

  } catch (error: any) {
    console.error('💥 ERRO:', error);
    
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