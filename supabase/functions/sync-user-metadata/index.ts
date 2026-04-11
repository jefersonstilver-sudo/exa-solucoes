
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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

    console.log('[sync-user-metadata] Iniciando sincronização de metadados')
    
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

    const { email } = await req.json()
    
    if (!email) {
      throw new Error('Email é obrigatório')
    }

    console.log('[sync-user-metadata] Buscando usuário:', email)
    
    // Buscar usuário pelo email
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('[sync-user-metadata] Erro ao listar usuários:', authError)
      throw authError
    }

    const targetUser = authUsers.users.find(user => user.email === email)
    
    if (!targetUser) {
      throw new Error(`Usuário com email ${email} não encontrado`)
    }

    console.log('[sync-user-metadata] Usuário encontrado, ID:', targetUser.id)
    
    // Buscar role na tabela users
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', targetUser.id)
      .single()

    if (dbError) {
      console.error('[sync-user-metadata] Erro ao buscar role na tabela users:', dbError)
      throw dbError
    }

    if (!dbUser) {
      throw new Error('Usuário não encontrado na tabela users')
    }

    console.log('[sync-user-metadata] Role encontrado na tabela users:', dbUser.role)
    
    // Atualizar metadados do usuário
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        user_metadata: {
          ...targetUser.user_metadata,
          role: dbUser.role,
          name: targetUser.user_metadata?.name || 'Jeferson Stilver',
        },
      }
    )

    if (updateError) {
      console.error('[sync-user-metadata] Erro ao atualizar metadados:', updateError)
      throw updateError
    }

    console.log('[sync-user-metadata] Metadados sincronizados com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Metadados do usuário sincronizados com sucesso',
        user: { 
          id: updatedUser.user.id, 
          email: updatedUser.user.email,
          role: dbUser.role,
          metadata_updated: true
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[sync-user-metadata] Erro crítico:', error)
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
