
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CheckResult {
  error?: any;
  status?: number;
}

export const checkExistingUser = async (email: string): Promise<CheckResult> => {
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

  console.log('🔍 [CREATE-ADMIN] Verificando usuário existente...');

  try {
    // Verificar se email já existe em auth.users
    const { data: authUsers, error: authError } = await supabaseServiceRole.auth.admin.listUsers();
    if (authError) {
      console.error('❌ [CREATE-ADMIN] Erro ao verificar auth.users:', authError);
      return {
        error: { 
          error: 'Erro ao verificar usuários existentes',
          code: 'AUTH_CHECK_ERROR',
          details: authError.message
        },
        status: 500
      };
    }

    const emailExistsAuth = authUsers.users.some(user => user.email === email);
    if (emailExistsAuth) {
      console.log('⚠️ [CREATE-ADMIN] Email já existe em auth.users');
      return {
        error: { 
          error: 'Este email já possui uma conta no sistema',
          code: 'EMAIL_EXISTS'
        },
        status: 409
      };
    }

    // Verificar se existe na tabela public.users
    const { data: publicUsers, error: publicError } = await supabaseServiceRole
      .from('users')
      .select('email')
      .eq('email', email)
      .limit(1);

    if (publicError) {
      console.error('❌ [CREATE-ADMIN] Erro ao verificar public.users:', publicError);
      return {
        error: { 
          error: 'Erro ao verificar usuários na base de dados',
          code: 'DB_CHECK_ERROR',
          details: publicError.message
        },
        status: 500
      };
    }

    if (publicUsers && publicUsers.length > 0) {
      console.log('⚠️ [CREATE-ADMIN] Email já existe em public.users');
      return {
        error: { 
          error: 'Este email já está registrado na base de dados',
          code: 'EMAIL_EXISTS'
        },
        status: 409
      };
    }

    console.log('✅ [CREATE-ADMIN] Email verificado, não existe duplicata');
    return {};
  } catch (error) {
    console.error('💥 [CREATE-ADMIN] Erro ao verificar usuário:', error);
    return {
      error: { 
        error: 'Erro crítico na verificação de usuário',
        code: 'CHECK_ERROR',
        details: error.message
      },
      status: 500
    };
  }
};
