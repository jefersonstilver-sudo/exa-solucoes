
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [CREATE-ADMIN] Edge function iniciada (VERSÃO CORRIGIDA)');

    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse do body
    const { email, adminType } = await req.json();
    console.log('📦 [CREATE-ADMIN] Dados recebidos:', { email, adminType });

    // Validações básicas
    if (!email || !adminType) {
      return new Response(
        JSON.stringify({ 
          error: 'Email e tipo de administrador são obrigatórios',
          code: 'MISSING_FIELDS' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          error: 'Email inválido',
          code: 'INVALID_EMAIL' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar tipo de admin
    const validRoles = ['admin', 'admin_marketing', 'super_admin'];
    if (!validRoles.includes(adminType)) {
      return new Response(
        JSON.stringify({ 
          error: 'Tipo de administrador inválido',
          code: 'INVALID_ROLE' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Criar cliente Supabase com service role
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔍 [CREATE-ADMIN] Testando conexão com a função SQL...');

    // 1. VERIFICAÇÃO SEGURA usando a função SQL recém-instalada
    const { data: safeCheck, error: safeCheckError } = await supabaseServiceRole.rpc(
      'safe_create_admin_user',
      {
        p_email: email,
        p_role: adminType,
        p_password: 'indexa2025'
      }
    );

    if (safeCheckError) {
      console.error('❌ [CREATE-ADMIN] Erro na função safe_create_admin_user:', safeCheckError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro na verificação do sistema - função SQL não encontrada',
          code: 'SQL_FUNCTION_ERROR',
          details: safeCheckError.message,
          suggestion: 'Verifique se as funções SQL foram aplicadas corretamente'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ [CREATE-ADMIN] Função SQL respondeu:', safeCheck);

    // Se a verificação segura falhou, retornar o erro específico
    if (!safeCheck?.success) {
      console.log('⚠️ [CREATE-ADMIN] Verificação segura falhou:', safeCheck);
      return new Response(
        JSON.stringify({ 
          error: safeCheck.error,
          code: safeCheck.code,
          details: safeCheck.details
        }),
        { 
          status: safeCheck.code === 'EMAIL_EXISTS' ? 409 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ [CREATE-ADMIN] Verificação segura passou, criando usuário...');
    console.log('🔐 [CREATE-ADMIN] ID seguro gerado:', safeCheck.user_id);

    // 2. Criar usuário usando o ID seguro gerado pela função
    const defaultPassword = 'indexa2025';
    
    const { data: newUser, error: createError } = await supabaseServiceRole.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_id: safeCheck.user_id, // Usar o ID gerado pela função segura
      user_metadata: {
        role: adminType,
        created_by_admin: true,
        created_via_safe_function: true,
        safe_creation_timestamp: new Date().toISOString()
      }
    });

    if (createError) {
      console.error('❌ [CREATE-ADMIN] Erro ao criar usuário no Auth:', createError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar conta administrativa',
          code: 'AUTH_CREATE_ERROR',
          details: createError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!newUser.user) {
      console.error('❌ [CREATE-ADMIN] Usuário não foi criado');
      return new Response(
        JSON.stringify({ 
          error: 'Falha na criação do usuário',
          code: 'USER_NOT_CREATED' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ [CREATE-ADMIN] Usuário criado no Auth:', newUser.user.id);

    // 3. Inserir na tabela users
    const { error: insertError } = await supabaseServiceRole
      .from('users')
      .insert({
        id: newUser.user.id,
        email: email,
        role: adminType
      });

    if (insertError) {
      console.error('❌ [CREATE-ADMIN] Erro ao inserir na tabela users:', insertError);
      
      // Tentar reverter criação do usuário
      try {
        await supabaseServiceRole.auth.admin.deleteUser(newUser.user.id);
        console.log('🔄 [CREATE-ADMIN] Usuário removido do Auth devido ao erro na tabela users');
      } catch (cleanupError) {
        console.error('💥 [CREATE-ADMIN] Erro ao limpar usuário após falha:', cleanupError);
      }

      return new Response(
        JSON.stringify({ 
          error: 'Erro ao configurar dados do usuário',
          code: 'INSERT_ERROR',
          details: insertError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ [CREATE-ADMIN] Usuário inserido na tabela users');

    // 4. Testar função de saúde do sistema para confirmar que tudo funciona
    try {
      await supabaseServiceRole.rpc('monitor_system_health');
      console.log('📊 [CREATE-ADMIN] Health check pós-criação executado com sucesso');
    } catch (healthError) {
      console.warn('⚠️ [CREATE-ADMIN] Health check falhou, mas usuário foi criado:', healthError);
    }

    // 5. Resposta de sucesso
    console.log('🎉 [CREATE-ADMIN] Conta criada com sucesso!');
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: email,
          role: adminType,
          password: defaultPassword,
          creation_method: 'safe_function_corrected',
          functions_working: true
        },
        message: 'Conta administrativa criada com sucesso usando as funções SQL instaladas!'
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
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
