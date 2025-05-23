
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

    console.log('[fix-master-admin] Iniciando correção do usuário master admin')
    
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
    
    console.log('[fix-master-admin] Procurando usuário master:', masterEmail)

    // Get all users and find the master admin
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('[fix-master-admin] Erro ao listar usuários:', authError)
      throw authError
    }

    let masterUser = authUsers.users.find(user => user.email === masterEmail)
    
    if (!masterUser) {
      console.log('[fix-master-admin] Usuário master não encontrado, criando...')
      
      // Create the master admin user
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
        console.error('[fix-master-admin] Erro ao criar usuário master:', createError)
        throw createError
      }

      masterUser = newUserData.user
      console.log('[fix-master-admin] Usuário master criado com sucesso')
    } else {
      console.log('[fix-master-admin] Usuário master encontrado, atualizando...')
      
      // Update the existing user
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        masterUser.id,
        {
          password: masterPassword,
          email_confirm: true,
          user_metadata: {
            ...masterUser.user_metadata,
            role: 'super_admin',
            name: 'Jefferson Silver',
          },
        }
      )

      if (updateError) {
        console.error('[fix-master-admin] Erro ao atualizar usuário master:', updateError)
        throw updateError
      }

      masterUser = updatedUser.user
      console.log('[fix-master-admin] Usuário master atualizado com sucesso')
    }

    // Ensure user exists in users table
    const { data: existingDbUser, error: dbCheckError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', masterUser.id)
      .single()

    if (dbCheckError && dbCheckError.code !== 'PGRST116') {
      console.error('[fix-master-admin] Erro ao verificar usuário na tabela users:', dbCheckError)
      throw dbCheckError
    }

    if (!existingDbUser) {
      console.log('[fix-master-admin] Inserindo usuário na tabela users...')
      
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: masterUser.id,
          email: masterUser.email,
          role: 'super_admin',
        })

      if (insertError) {
        console.error('[fix-master-admin] Erro ao inserir na tabela users:', insertError)
        throw insertError
      }
      
      console.log('[fix-master-admin] Usuário inserido na tabela users com sucesso')
    } else {
      console.log('[fix-master-admin] Atualizando role na tabela users...')
      
      const { error: updateDbError } = await supabaseAdmin
        .from('users')
        .update({ role: 'super_admin' })
        .eq('id', masterUser.id)

      if (updateDbError) {
        console.error('[fix-master-admin] Erro ao atualizar tabela users:', updateDbError)
        throw updateDbError
      }
      
      console.log('[fix-master-admin] Role atualizado na tabela users com sucesso')
    }

    console.log('[fix-master-admin] Correção do master admin concluída com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário master admin corrigido com sucesso',
        user: { 
          id: masterUser.id, 
          email: masterUser.email,
          role: 'super_admin'
        },
        confirmed: true,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[fix-master-admin] Erro crítico:', error)
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
