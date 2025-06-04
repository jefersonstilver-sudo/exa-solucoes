
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
    console.log('🚀 [CREATE-ADMIN] Edge function iniciada - versão simplificada');

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

    console.log('🔍 [CREATE-ADMIN] Iniciando verificação simplificada...');

    // VERIFICAÇÃO SIMPLIFICADA: Apenas email duplicado
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

    const emailExistsAuth = authUsers.users.some(user => user.email === email);
    if (emailExistsAuth) {
      console.log('⚠️ [CREATE-ADMIN] Email já existe em auth.users');
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
      console.log('⚠️ [CREATE-ADMIN] Email já existe em public.users');
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

    console.log('✅ [CREATE-ADMIN] Email verificado, não existe duplicata');

    // CRIAÇÃO COM RETRY LOGIC
    const defaultPassword = 'indexa2025';
    const maxRetries = 3;
    let attempt = 0;
    let newUser = null;
    let lastError = null;

    while (attempt < maxRetries && !newUser) {
      attempt++;
      console.log(`🔄 [CREATE-ADMIN] Tentativa ${attempt}/${maxRetries} de criação...`);

      try {
        // Criar usuário SEM especificar user_id - deixar Supabase gerar automaticamente
        const { data: createResult, error: createError } = await supabaseServiceRole.auth.admin.createUser({
          email,
          password: defaultPassword,
          email_confirm: true,
          // ❌ REMOVIDO: user_id: newUserId - deixar Supabase gerar automaticamente
          user_metadata: {
            role: adminType,
            created_by_admin: true,
            creation_method: 'simplified_edge_function',
            creation_timestamp: new Date().toISOString(),
            attempt_number: attempt
          }
        });

        if (createError) {
          console.error(`❌ [CREATE-ADMIN] Tentativa ${attempt} falhou:`, createError);
          lastError = createError;
          
          // Se for erro de rate limit, aguardar antes de tentar novamente
          if (createError.message?.includes('rate limit') || createError.message?.includes('too many')) {
            console.log(`⏳ [CREATE-ADMIN] Rate limit detectado, aguardando 2 segundos...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          continue;
        }

        if (!createResult.user) {
          console.error(`❌ [CREATE-ADMIN] Tentativa ${attempt}: Usuário não foi criado`);
          lastError = new Error('Usuário não foi criado');
          continue;
        }

        newUser = createResult.user;
        console.log(`✅ [CREATE-ADMIN] Usuário criado com sucesso na tentativa ${attempt}:`, newUser.id);
        break;

      } catch (error) {
        console.error(`💥 [CREATE-ADMIN] Erro na tentativa ${attempt}:`, error);
        lastError = error;
        
        // Aguardar antes da próxima tentativa
        if (attempt < maxRetries) {
          console.log(`⏳ [CREATE-ADMIN] Aguardando 1 segundo antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Verificar se conseguiu criar o usuário
    if (!newUser) {
      console.error('❌ [CREATE-ADMIN] Falhou em todas as tentativas');
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar conta administrativa após múltiplas tentativas',
          code: 'AUTH_CREATE_ERROR',
          details: lastError?.message || 'Erro desconhecido',
          attempts: attempt
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ [CREATE-ADMIN] Usuário criado no Auth, inserindo na tabela users...');

    // Inserir na tabela users com retry
    let insertSuccess = false;
    attempt = 0;

    while (attempt < maxRetries && !insertSuccess) {
      attempt++;
      console.log(`🔄 [CREATE-ADMIN] Tentativa ${attempt}/${maxRetries} de inserção na tabela users...`);

      try {
        const { error: insertError } = await supabaseServiceRole
          .from('users')
          .insert({
            id: newUser.id,
            email: email,
            role: adminType
          });

        if (insertError) {
          console.error(`❌ [CREATE-ADMIN] Erro na inserção (tentativa ${attempt}):`, insertError);
          
          // Se for erro de chave duplicada, verificar se foi inserido por outro processo
          if (insertError.code === '23505') {
            console.log('🔍 [CREATE-ADMIN] Verificando se registro já existe...');
            const { data: existingUser } = await supabaseServiceRole
              .from('users')
              .select('*')
              .eq('id', newUser.id)
              .limit(1);
            
            if (existingUser && existingUser.length > 0) {
              console.log('✅ [CREATE-ADMIN] Registro já existe na tabela users');
              insertSuccess = true;
              break;
            }
          }
          
          lastError = insertError;
          
          // Aguardar antes da próxima tentativa
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          continue;
        }

        insertSuccess = true;
        console.log(`✅ [CREATE-ADMIN] Usuário inserido na tabela users na tentativa ${attempt}`);
        break;

      } catch (error) {
        console.error(`💥 [CREATE-ADMIN] Erro na inserção (tentativa ${attempt}):`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!insertSuccess) {
      console.error('❌ [CREATE-ADMIN] Falhou ao inserir na tabela users, removendo do Auth...');
      
      // Tentar reverter criação do usuário
      try {
        await supabaseServiceRole.auth.admin.deleteUser(newUser.id);
        console.log('🔄 [CREATE-ADMIN] Usuário removido do Auth devido ao erro na tabela users');
      } catch (cleanupError) {
        console.error('💥 [CREATE-ADMIN] Erro ao limpar usuário após falha:', cleanupError);
      }

      return new Response(
        JSON.stringify({ 
          error: 'Erro ao configurar dados do usuário após múltiplas tentativas',
          code: 'INSERT_ERROR',
          details: lastError?.message || 'Erro desconhecido',
          attempts: attempt
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Resposta de sucesso
    console.log('🎉 [CREATE-ADMIN] Conta criada com sucesso!');
    
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.id,
          email: email,
          role: adminType,
          password: defaultPassword,
          creation_method: 'simplified_edge_function'
        },
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
