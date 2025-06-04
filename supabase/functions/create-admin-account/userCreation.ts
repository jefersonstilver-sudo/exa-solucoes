
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateUserResult {
  user?: any;
  error?: any;
  status?: number;
}

export const createAdminUser = async (email: string, adminType: string): Promise<CreateUserResult> => {
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

  const defaultPassword = 'indexa2025';
  const maxRetries = 3;
  let attempt = 0;
  let newUser = null;
  let lastError = null;

  // Criar usuário com retry logic
  while (attempt < maxRetries && !newUser) {
    attempt++;
    console.log(`🔄 [CREATE-ADMIN] Tentativa ${attempt}/${maxRetries} de criação...`);

    try {
      const { data: createResult, error: createError } = await supabaseServiceRole.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          role: adminType,
          created_by_admin: true,
          creation_method: 'refactored_edge_function',
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
      
      if (attempt < maxRetries) {
        console.log(`⏳ [CREATE-ADMIN] Aguardando 1 segundo antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  if (!newUser) {
    console.error('❌ [CREATE-ADMIN] Falhou em todas as tentativas');
    return {
      error: { 
        error: 'Erro ao criar conta administrativa após múltiplas tentativas',
        code: 'AUTH_CREATE_ERROR',
        details: lastError?.message || 'Erro desconhecido',
        attempts: attempt
      },
      status: 500
    };
  }

  // Inserir na tabela users
  const insertResult = await insertUserRecord(supabaseServiceRole, newUser, email, adminType);
  if (insertResult.error) {
    // Reverter criação do usuário
    try {
      await supabaseServiceRole.auth.admin.deleteUser(newUser.id);
      console.log('🔄 [CREATE-ADMIN] Usuário removido do Auth devido ao erro na tabela users');
    } catch (cleanupError) {
      console.error('💥 [CREATE-ADMIN] Erro ao limpar usuário após falha:', cleanupError);
    }

    return insertResult;
  }

  return {
    user: {
      id: newUser.id,
      email: email,
      role: adminType,
      password: defaultPassword,
      creation_method: 'refactored_edge_function'
    }
  };
};

const insertUserRecord = async (supabase: any, newUser: any, email: string, adminType: string) => {
  const maxRetries = 3;
  let attempt = 0;
  let insertSuccess = false;
  let lastError = null;

  console.log('✅ [CREATE-ADMIN] Usuário criado no Auth, inserindo na tabela users...');

  while (attempt < maxRetries && !insertSuccess) {
    attempt++;
    console.log(`🔄 [CREATE-ADMIN] Tentativa ${attempt}/${maxRetries} de inserção na tabela users...`);

    try {
      const { error: insertError } = await supabase
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
          const { data: existingUser } = await supabase
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
    console.error('❌ [CREATE-ADMIN] Falhou ao inserir na tabela users');
    return {
      error: { 
        error: 'Erro ao configurar dados do usuário após múltiplas tentativas',
        code: 'INSERT_ERROR',
        details: lastError?.message || 'Erro desconhecido',
        attempts: attempt
      },
      status: 500
    };
  }

  return {};
};
