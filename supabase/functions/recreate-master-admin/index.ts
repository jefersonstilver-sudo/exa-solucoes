
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
      throw new Error('Variáveis de ambiente não configuradas')
    }

    console.log('[recreate-master-admin] Iniciando recriação completa do usuário master admin')
    
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

    const masterEmail = 'jefersonstilver@gmail.com'
    const masterPassword = '573039'
    
    console.log('[recreate-master-admin] Buscando usuário existente:', masterEmail)

    // Step 1: Find and delete existing user if it exists
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('[recreate-master-admin] Erro ao listar usuários:', authError)
      throw authError
    }

    const existingUser = authUsers.users.find(user => user.email === masterEmail)
    
    if (existingUser) {
      console.log('[recreate-master-admin] Deletando usuário existente:', existingUser.id)
      
      // Delete from users table first
      const { error: deleteDbError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', existingUser.id)

      if (deleteDbError && deleteDbError.code !== 'PGRST116') {
        console.error('[recreate-master-admin] Erro ao deletar da tabela users:', deleteDbError)
      }
      
      // Delete from auth.users
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
      
      if (deleteAuthError) {
        console.error('[recreate-master-admin] Erro ao deletar usuário auth:', deleteAuthError)
        throw deleteAuthError
      }
      
      console.log('[recreate-master-admin] Usuário existente deletado com sucesso')
    }

    // Step 2: Create new master admin user with correct data
    console.log('[recreate-master-admin] Criando novo usuário master admin')
    
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: masterEmail,
      password: masterPassword,
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        name: 'Jefferson Silver',
      },
    })

    if (createError) {
      console.error('[recreate-master-admin] Erro ao criar usuário master:', createError)
      throw createError
    }

    if (!newUserData.user) {
      throw new Error('Usuário não foi criado corretamente')
    }

    console.log('[recreate-master-admin] Usuário master criado com sucesso:', newUserData.user.id)

    // Step 3: Insert into users table
    console.log('[recreate-master-admin] Inserindo na tabela users')
    
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUserData.user.id,
        email: newUserData.user.email,
        role: 'super_admin',
      })

    if (insertError) {
      console.error('[recreate-master-admin] Erro ao inserir na tabela users:', insertError)
      throw insertError
    }
    
    console.log('[recreate-master-admin] Usuário inserido na tabela users com sucesso')

    // Step 4: Verify everything is correct
    const { data: verifyUser, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', newUserData.user.id)
      .single()

    if (verifyError || !verifyUser) {
      throw new Error('Falha na verificação do usuário criado')
    }

    console.log('[recreate-master-admin] Verificação completa:', verifyUser)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário master admin recriado com sucesso',
        user: { 
          id: newUserData.user.id, 
          email: newUserData.user.email,
          role: 'super_admin',
          metadata: newUserData.user.user_metadata
        },
        verified: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[recreate-master-admin] Erro crítico:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: String(error),
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
