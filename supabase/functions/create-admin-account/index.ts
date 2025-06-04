
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
    console.log('🚀 [CREATE-ADMIN] Edge function iniciada com fallback inteligente');

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

    console.log('🔍 [CREATE-ADMIN] Iniciando verificação inteligente...');

    // VERIFICAÇÃO INTELIGENTE: Tentar função SQL primeiro, fallback se falhar
    let newUserId;
    let usesSqlFunction = false;

    try {
      console.log('🔧 [CREATE-ADMIN] Tentando usar função SQL...');
      
      const { data: safeCheck, error: safeCheckError } = await supabaseServiceRole.rpc(
        'safe_create_admin_user',
        {
          p_email: email,
          p_role: adminType,
          p_password: 'indexa2025'
        }
      );

      if (safeCheckError) {
        throw new Error(`Função SQL não disponível: ${safeCheckError.message}`);
      }

      if (!safeCheck?.success) {
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

      newUserId = safeCheck.user_id;
      usesSqlFunction = true;
      console.log('✅ [CREATE-ADMIN] Função SQL funcionando! ID gerado:', newUserId);
      
    } catch (sqlError) {
      console.warn('⚠️ [CREATE-ADMIN] Função SQL não disponível, usando fallback:', sqlError.message);
      
      // FALLBACK: Verificação manual se função SQL falhar
      console.log('🔄 [CREATE-ADMIN] Executando verificação manual...');
      
      // Verificar se email já existe em auth.users
      const { data: authUsers, error: authError } = await supabaseServiceRole.auth.admin.listUsers();
      if (authError) {
        console.error('❌ [CREATE-ADMIN] Erro ao verificar auth.users:', authError);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao verificar usuários existentes',
            code: 'AUTH_CHECK_ERROR',
            details: authError.message
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const emailExists = authUsers.users.some(user => user.email === email);
      if (emailExists) {
        return new Response(
          JSON.stringify({ 
            error: 'Este email já possui uma conta no sistema',
            code: 'EMAIL_EXISTS'
          }),
          { 
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Verificar se existe na tabela public.users
      const { data: publicUsers, error: publicError } = await supabaseServiceRole
        .from('users')
        .select('email')
        .eq('email', email)
        .limit(1);

      if (publicError) {
        console.error('❌ [CREATE-ADMIN] Erro ao verificar public.users:', publicError);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao verificar usuários na base de dados',
            code: 'DB_CHECK_ERROR',
            details: publicError.message
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (publicUsers && publicUsers.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Este email já está registrado na base de dados',
            code: 'EMAIL_EXISTS'
          }),
          { 
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Gerar ID único manualmente
      newUserId = crypto.randomUUID();
      console.log('🔐 [CREATE-ADMIN] ID gerado via fallback:', newUserId);
    }

    console.log('✅ [CREATE-ADMIN] Verificação concluída, criando usuário...');

    // Criar usuário usando o ID gerado (SQL ou fallback)
    const defaultPassword = 'indexa2025';
    
    const { data: newUser, error: createError } = await supabaseServiceRole.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_id: newUserId,
      user_metadata: {
        role: adminType,
        created_by_admin: true,
        creation_method: usesSqlFunction ? 'sql_function' : 'manual_fallback',
        creation_timestamp: new Date().toISOString()
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

    // Inserir na tabela users
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

    // Testar função de monitoramento (opcional)
    try {
      await supabaseServiceRole.rpc('monitor_system_health');
      console.log('📊 [CREATE-ADMIN] Health check executado com sucesso');
    } catch (healthError) {
      console.warn('⚠️ [CREATE-ADMIN] Health check não disponível (normal se funções SQL não estiverem instaladas)');
    }

    // Resposta de sucesso
    console.log('🎉 [CREATE-ADMIN] Conta criada com sucesso!');
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: email,
          role: adminType,
          password: defaultPassword,
          creation_method: usesSqlFunction ? 'sql_function' : 'manual_fallback',
          sql_functions_available: usesSqlFunction
        },
        message: `Conta administrativa criada com sucesso! Método: ${usesSqlFunction ? 'Função SQL' : 'Fallback Manual'}`
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
