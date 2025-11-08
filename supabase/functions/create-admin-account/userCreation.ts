// VERSÃO CORRIGIDA - 2025-11-08 23:50 UTC
// Fix: Incluir role obrigatório na inserção
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateUserResult {
  user?: any;
  password?: string;
  error?: any;
  status?: number;
}

export const createAdminUser = async (
  email: string, 
  adminType: string, 
  nome?: string,
  cpf?: string,
  tipo_documento?: string
): Promise<CreateUserResult> => {
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

  const defaultPassword = 'exa2025';
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
        email_confirm: false, // Enviar email de confirmação
        user_metadata: {
          role: adminType,
          created_by_admin: true,
          creation_method: 'refactored_edge_function',
          creation_timestamp: new Date().toISOString(),
          attempt_number: attempt,
          name: nome || email.split('@')[0]
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

  // Inserir usuário na tabela users com o role
  const insertResult = await insertUserRecord(supabaseServiceRole, newUser, email, adminType, nome, cpf, tipo_documento);
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
      creation_method: 'refactored_edge_function'
    },
    password: defaultPassword
  };
};

const insertUserRecord = async (
  supabase: any, 
  newUser: any, 
  email: string, 
  adminType: string,
  nome?: string,
  cpf?: string,
  tipo_documento?: string
) => {
  const maxRetries = 3;
  let attempt = 0;
  let insertSuccess = false;
  let lastError = null;

  console.log('✅ [CREATE-ADMIN] Usuário criado no Auth, inserindo na tabela users...');

  while (attempt < maxRetries && !insertSuccess) {
    attempt++;
    console.log(`🔄 [CREATE-ADMIN] Tentativa ${attempt}/${maxRetries} de inserção na tabela users...`);

    try {
      // Preparar dados do usuário incluindo o role (campo obrigatório)
      const userData: any = {
        id: newUser.id,
        email: email,
        role: adminType // Campo obrigatório na tabela users
      };
      
      // Adicionar campos opcionais se fornecidos
      if (nome) userData.nome = nome;
      if (cpf) userData.cpf = cpf;
      if (tipo_documento) userData.tipo_documento = tipo_documento;
      
      console.log('💾 [CREATE-ADMIN] Inserindo dados:', { 
        id: userData.id, 
        email: userData.email, 
        role: userData.role,
        nome: userData.nome || 'não fornecido',
        cpf: cpf ? '***' : undefined 
      });
      
      const { error: insertError } = await supabase
        .from('users')
        .insert(userData);

      if (insertError) {
        console.error(`❌ [CREATE-ADMIN] Erro na inserção (tentativa ${attempt}):`, insertError);
        
        // Se for erro de chave duplicada, verificar e atualizar se necessário
        if (insertError.code === '23505') {
          console.log('🔍 [CREATE-ADMIN] Verificando registro existente...');
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', newUser.id)
            .single();
          
          if (existingUser) {
            // Verificar se os dados estão corretos
            const needsUpdate = existingUser.role !== adminType || 
                               (nome && existingUser.nome !== nome) ||
                               (cpf && existingUser.cpf !== cpf);
            
            if (needsUpdate) {
              console.log('🔄 [CREATE-ADMIN] Atualizando registro existente com dados corretos...');
              const { error: updateError } = await supabase
                .from('users')
                .update(userData)
                .eq('id', newUser.id);
              
              if (updateError) {
                console.error('❌ [CREATE-ADMIN] Erro ao atualizar:', updateError);
                lastError = updateError;
                continue;
              }
              console.log('✅ [CREATE-ADMIN] Registro atualizado com sucesso');
            } else {
              console.log('✅ [CREATE-ADMIN] Registro já existe com dados corretos');
            }
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
      console.log(`✅ [CREATE-ADMIN] Usuário inserido na tabela users com role ${adminType} na tentativa ${attempt}`);
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
