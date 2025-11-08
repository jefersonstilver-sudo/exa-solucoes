
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { validateRequest } from './validation.ts';
import { checkExistingUser } from './userChecks.ts';
import { createAdminUser } from './userCreation.ts';
import { sendAdminWelcomeEmail } from './emailService.ts';
import { sendSuperAdminNotification } from './admin-notification.ts';
import { corsHeaders } from './cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [CREATE-ADMIN] Edge function iniciada - versão refatorada');

    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse e validação da requisição
    const validationResult = await validateRequest(req);
    if (validationResult.error) {
      return new Response(
        JSON.stringify(validationResult.error),
        { 
          status: validationResult.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { email, adminType, nome, cpf, tipo_documento } = validationResult.data;

    // Verificar se usuário já existe
    const existingUserCheck = await checkExistingUser(email);
    if (existingUserCheck.error) {
      return new Response(
        JSON.stringify(existingUserCheck.error),
        { 
          status: existingUserCheck.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Criar usuário administrativo
    const createResult = await createAdminUser(email, adminType, nome, cpf, tipo_documento);
    if (createResult.error) {
      return new Response(
        JSON.stringify(createResult.error),
        { 
          status: createResult.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Buscar usuário autenticado que está criando a conta
    const authHeader = req.headers.get('authorization');
    let createdByName = 'Sistema';
    let createdById = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      
      if (user) {
        createdById = user.id;
        const { data: userProfile } = await supabaseAdmin
          .from('users')
          .select('nome, email')
          .eq('id', user.id)
          .single();
        
        if (userProfile) {
          createdByName = userProfile.nome || userProfile.email || 'Sistema';
        }
      }
    }

    // Enviar email de boas-vindas profissional
    console.log('📧 [CREATE-ADMIN] Enviando email de boas-vindas profissional...');
    const emailResult = await sendAdminWelcomeEmail({
      email,
      role: adminType,
      password: createResult.password || 'exa2025',
      nome: nome || email.split('@')[0],
      createdBy: createdByName
    });
    
    if (!emailResult.success) {
      console.warn('⚠️ [CREATE-ADMIN] Conta criada mas email de boas-vindas não enviado:', emailResult.error);
      
      // Tentar enviar email de confirmação via unified-email-service como fallback
      console.log('🔄 [CREATE-ADMIN] Tentando enviar email de confirmação como alternativa...');
      try {
        const { error: confirmError } = await supabase.functions.invoke('unified-email-service', {
          body: {
            type: 'resend-confirmation',
            email: email,
            userName: nome || email.split('@')[0]
          }
        });
        
        if (!confirmError) {
          console.log('✅ [CREATE-ADMIN] Email de confirmação enviado como alternativa');
        }
      } catch (fallbackError) {
        console.error('❌ [CREATE-ADMIN] Falha no envio do email de confirmação:', fallbackError);
      }
    } else {
      console.log('✅ [CREATE-ADMIN] Email profissional enviado com sucesso!');
    }

    // Buscar todos os super admins para notificar
    console.log('📨 [CREATE-ADMIN] Notificando super administradores...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: superAdmins, error: superAdminError } = await supabase
      .from('users')
      .select('email, nome')
      .eq('role', 'super_admin');

    let notificationsSent = 0;
    if (!superAdminError && superAdmins && superAdmins.length > 0) {
      console.log(`📬 [CREATE-ADMIN] Encontrados ${superAdmins.length} super admins`);
      
      const timestamp = new Date().toISOString();
      
      // Garantir que campos não fiquem vazios
      const nomeCompleto = nome?.trim() || email.split('@')[0] || 'Usuário';
      const cpfFormatado = cpf || 'Não informado';

      for (const admin of superAdmins) {
        try {
          const notificationResult = await sendSuperAdminNotification({
            superAdminEmail: admin.email,
            superAdminName: admin.nome?.trim() || 'Administrador',
            newUser: {
              nome: nomeCompleto,
              email,
              role: adminType,
              cpf: cpfFormatado,
              tipo_documento: tipo_documento || 'Não informado'
            },
            createdBy: createdByName,
            emailSentStatus: emailResult.success,
            timestamp
          });

          if (notificationResult.success) {
            notificationsSent++;
          }
        } catch (notifError) {
          console.error(`❌ [CREATE-ADMIN] Erro ao notificar ${admin.email}:`, notifError);
        }
      }

      console.log(`✅ [CREATE-ADMIN] ${notificationsSent}/${superAdmins.length} notificações enviadas`);
    } else {
      console.warn('⚠️ [CREATE-ADMIN] Nenhum super admin encontrado para notificar');
    }

    // Registrar atividade em auditoria
    console.log('📝 [CREATE-ADMIN] Registrando em auditoria...');
    try {
      const { error: auditError } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: createResult.user?.id || null,
          action_type: 'ADMIN_ACCOUNT_CREATED',
          entity_type: 'user',
          entity_id: createResult.user?.id || null,
          action_description: `Nova conta administrativa ${adminType} criada para ${email}`,
          metadata: {
            created_account: {
              email,
              nome: nome || email.split('@')[0],
              role: adminType,
              cpf: cpf || null,
              tipo_documento: tipo_documento || null
            },
            email_sent: emailResult.success,
            notifications_sent: notificationsSent,
            super_admins_notified: superAdmins?.length || 0,
            password_length: 8,
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent'),
            timestamp: new Date().toISOString()
          }
        });

      if (auditError) {
        console.error('❌ [CREATE-ADMIN] Erro ao registrar auditoria:', auditError);
      } else {
        console.log('✅ [CREATE-ADMIN] Auditoria registrada com sucesso');
      }
    } catch (auditError) {
      console.error('💥 [CREATE-ADMIN] Erro crítico na auditoria:', auditError);
    }

    // Resposta de sucesso
    console.log('🎉 [CREATE-ADMIN] Conta criada com sucesso!');
    
    return new Response(
      JSON.stringify({
        success: true,
        user: createResult.user,
        password: createResult.password,
        emailSent: emailResult.success,
        notificationsSent: notificationsSent,
        auditLogged: true,
        message: 'Conta administrativa criada com sucesso!'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 [CREATE-ADMIN] Erro crítico não tratado:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
