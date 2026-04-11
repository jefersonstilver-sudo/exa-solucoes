import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, newEmail, updateEmail } = await req.json();
    
    console.log('🚀 [RESEND-WELCOME] Iniciando...');
    console.log(`📧 userId: ${userId}, newEmail: ${newEmail}, updateEmail: ${updateEmail}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Se precisa atualizar o email
    if (updateEmail && newEmail) {
      console.log('🔄 Atualizando email no banco...');
      
      // Atualizar em auth.users
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: newEmail
      });
      
      if (authError) {
        console.error('❌ Erro ao atualizar auth.users:', authError);
      } else {
        console.log('✅ Email atualizado em auth.users');
      }
      
      // Atualizar em public.users
      const { error: publicError } = await supabaseAdmin
        .from('users')
        .update({ email: newEmail })
        .eq('id', userId);
      
      if (publicError) {
        console.error('❌ Erro ao atualizar public.users:', publicError);
      } else {
        console.log('✅ Email atualizado em public.users');
      }
    }

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('nome, email, role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('❌ Usuário não encontrado:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Usuário: ${userData.nome} (${userData.email}) - Role: ${userData.role}`);

    // IMPORTANTE: Confirmar email automaticamente antes de enviar
    // Isso garante que o usuário possa fazer login imediatamente após receber o email
    console.log('🔓 Confirmando email do usuário...');
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    });
    
    if (confirmError) {
      console.error('⚠️ Erro ao confirmar email:', confirmError);
      // Não falhar aqui, apenas logar o aviso
    } else {
      console.log('✅ Email confirmado automaticamente!');
    }

    // Enviar email de boas-vindas
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const siteUrl = Deno.env.get('SITE_URL') || 'https://www.examidia.com.br';
    const emailToSend = newEmail || userData.email;
    
    // Gerar senha temporária
    const tempPassword = 'exa2025';

    const roleLabels: Record<string, string> = {
      'super_admin': 'Super Administrador',
      'admin': 'Administrador',
      'admin_marketing': 'Admin de Marketing',
      'admin_financeiro': 'Admin Financeiro',
      'comercial': 'Comercial'
    };

    const roleLabel = roleLabels[userData.role] || userData.role;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #C7141A 0%, #9C1E1E 100%); padding: 40px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
        🎉 Bem-vindo(a) à EXA Mídia!
      </h1>
    </div>
    
    <div style="background: white; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
        Olá <strong>${userData.nome || emailToSend.split('@')[0]}</strong>! 👋
      </p>
      
      <p style="color: #666; line-height: 1.6;">
        Sua conta como <strong style="color: #C7141A;">${roleLabel}</strong> foi criada com sucesso no sistema EXA Mídia.
      </p>
      
      <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #C7141A;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #333;">📧 Seus dados de acesso:</p>
        <p style="margin: 8px 0; color: #555;"><strong>Email:</strong> ${emailToSend}</p>
        <p style="margin: 8px 0; color: #555;"><strong>Senha temporária:</strong> ${tempPassword}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${siteUrl}/sistema/login" style="display: inline-block; background: linear-gradient(135deg, #C7141A 0%, #9C1E1E 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Acessar o Sistema →
        </a>
      </div>
      
      <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
        ⚠️ Recomendamos que altere sua senha no primeiro acesso.
      </p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
      <p>© 2025 EXA Mídia - Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>
    `;

    console.log(`📤 Enviando email para: ${emailToSend}`);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'EXA Mídia <noreply@examidia.com.br>',
      to: [emailToSend],
      subject: `🎉 Bem-vindo(a) à Equipe EXA Mídia, ${userData.nome || 'Colaborador'}!`,
      html: htmlContent
    });

    if (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar email', details: emailError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Email enviado com sucesso!');
    console.log('📬 Resend ID:', emailData?.id);

    // Registrar no log de emails
    await supabaseAdmin.from('email_logs').insert({
      recipient_email: emailToSend,
      recipient_name: userData.nome,
      email_type: 'admin_welcome_resend',
      subject: `Bem-vindo(a) à Equipe EXA Mídia`,
      status: 'sent',
      resend_message_id: emailData?.id,
      metadata: { userId, role: userData.role, resent: true }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email enviado com sucesso!',
        resendId: emailData?.id,
        sentTo: emailToSend
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Erro crítico:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
