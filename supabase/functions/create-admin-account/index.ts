
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
    console.log('🚀 [CREATE-ADMIN] Edge function iniciada');

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

    // Criar cliente Supabase com service role (sem rate limits)
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

    console.log('🔍 [CREATE-ADMIN] Verificando se email já existe...');

    // 1. Verificar se o email já existe
    const { data: existingUsers, error: checkError } = await supabaseServiceRole.auth.admin.listUsers();
    
    if (checkError) {
      console.error('❌ [CREATE-ADMIN] Erro ao verificar usuários existentes:', checkError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro interno do servidor',
          code: 'CHECK_ERROR',
          details: checkError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar se email já existe
    const emailExists = existingUsers?.users?.some(user => user.email === email);
    if (emailExists) {
      console.log('⚠️ [CREATE-ADMIN] Email já existe:', email);
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

    console.log('✅ [CREATE-ADMIN] Email disponível, criando conta...');

    // 2. Criar usuário usando service role (bypassa rate limits)
    const defaultPassword = 'indexa2025';
    
    const { data: newUser, error: createError } = await supabaseServiceRole.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        role: adminType,
        created_by_admin: true,
        created_via_edge_function: true
      }
    });

    if (createError) {
      console.error('❌ [CREATE-ADMIN] Erro ao criar usuário:', createError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar conta administrativa',
          code: 'CREATE_ERROR',
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

    // 4. Resposta de sucesso
    console.log('🎉 [CREATE-ADMIN] Conta criada com sucesso!');
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: email,
          role: adminType,
          password: defaultPassword // Incluir senha na resposta para exibir ao admin
        },
        message: 'Conta administrativa criada com sucesso!'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('💥 [CREATE-ADMIN] Erro crítico:', error);
    
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
