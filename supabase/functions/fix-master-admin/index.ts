
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Faltando variáveis de ambiente essenciais')
    }

    console.log('[fix-master-admin] Iniciando correção com URL:', supabaseUrl)
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Check if master admin exists in auth.users
    console.log('[fix-master-admin] Verificando usuário master nas tabelas auth')
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('[fix-master-admin] Erro ao listar usuários:', authError)
      throw authError
    }

    const masterEmail = 'jefersonstilver@gmail.com'
    const masterPassword = '573039'
    
    const masterUser = authUsers.users.find(user => user.email === masterEmail)
    
    console.log('[fix-master-admin] Resultado da busca:', masterUser ? 'Usuário encontrado' : 'Usuário não encontrado')
    
    if (!masterUser) {
      // Create the master admin user if it doesn't exist
      console.log('[fix-master-admin] Criando usuário master...')
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: masterEmail,
        password: masterPassword,
        email_confirm: true,
        user_metadata: {
          role: 'super_admin',
          name: 'Jefferson Silver',
        },
      })

      if (createError) {
        console.error('[fix-master-admin] Erro ao criar usuário master:', createError)
        throw createError
      }

      console.log('[fix-master-admin] Usuário criado com ID:', newUser.user.id)

      // Insert into users table
      console.log('[fix-master-admin] Inserindo na tabela users...')
      const { error: userError } = await supabaseAdmin.rpc(
        'admin_insert_user',
        {
          user_id: newUser.user.id,
          user_email: masterEmail,
          user_role: 'super_admin'
        }
      )

      if (userError) {
        console.error('[fix-master-admin] Erro ao inserir na tabela users:', userError)
        throw userError
      }

      console.log('[fix-master-admin] Usuário master criado com sucesso!')
      return new Response(
        JSON.stringify({
          message: 'Usuário admin master criado com sucesso',
          action: 'created',
          user: { id: newUser.user.id, email: newUser.user.email }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      // User exists, let's update their password and confirm email
      console.log('[fix-master-admin] Atualizando usuário existente:', masterUser.id)
      
      // Check if email is confirmed
      const isEmailConfirmed = masterUser.email_confirmed_at !== null
      console.log('[fix-master-admin] Status de confirmação de email:', isEmailConfirmed ? 'Confirmado' : 'Não confirmado')
      
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        masterUser.id,
        {
          password: masterPassword,
          email_confirm: true,
          user_metadata: {
            role: 'super_admin',
            name: 'Jefferson Silver',
          },
        }
      )

      if (updateError) {
        console.error('[fix-master-admin] Erro ao atualizar usuário:', updateError)
        throw updateError
      }

      console.log('[fix-master-admin] Usuário atualizado com sucesso')

      // Ensure user exists in users table
      console.log('[fix-master-admin] Verificando se existe na tabela users...')
      const { data: dbUser, error: dbCheckError } = await supabaseAdmin.rpc(
        'admin_check_user_exists',
        { user_email: masterEmail }
      )

      if (dbCheckError) {
        console.error('[fix-master-admin] Erro ao verificar usuário na tabela users:', dbCheckError)
        throw dbCheckError
      }

      if (!dbUser) {
        // Insert into users table if not exists
        console.log('[fix-master-admin] Inserindo usuário na tabela users...')
        const { error: userError } = await supabaseAdmin.rpc(
          'admin_insert_user',
          {
            user_id: masterUser.id,
            user_email: masterEmail,
            user_role: 'super_admin'
          }
        )

        if (userError) {
          console.error('[fix-master-admin] Erro ao inserir usuário na tabela users:', userError)
          throw userError
        }
        console.log('[fix-master-admin] Usuário inserido na tabela users com sucesso')
      } else {
        console.log('[fix-master-admin] Usuário já existe na tabela users')
      }

      // Double check the role in the users table
      console.log('[fix-master-admin] Verificando role na tabela users...')
      const { data: userRoleData, error: userRoleError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', masterUser.id)
        .single()
      
      if (userRoleError) {
        console.error('[fix-master-admin] Erro ao verificar role:', userRoleError)
      } else if (userRoleData && userRoleData.role !== 'super_admin') {
        console.log('[fix-master-admin] Atualizando role para super_admin...')
        const { error: updateRoleError } = await supabaseAdmin
          .from('users')
          .update({ role: 'super_admin' })
          .eq('id', masterUser.id)
        
        if (updateRoleError) {
          console.error('[fix-master-admin] Erro ao atualizar role:', updateRoleError)
        } else {
          console.log('[fix-master-admin] Role atualizada com sucesso')
        }
      } else {
        console.log('[fix-master-admin] Role já está correta:', userRoleData?.role)
      }

      return new Response(
        JSON.stringify({
          message: 'Usuário admin master atualizado com sucesso',
          action: 'updated',
          user: { id: updatedUser.user.id, email: updatedUser.user.email },
          confirmed: updatedUser.user.email_confirmed_at ? true : false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
  } catch (error) {
    console.error('[fix-master-admin] Erro crítico:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
