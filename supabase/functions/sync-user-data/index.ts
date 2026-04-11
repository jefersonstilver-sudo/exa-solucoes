
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

    console.log('[sync-user-data] Iniciando sincronização simples')
    
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

    console.log('[sync-user-data] Sincronizando usuário:', email)
    
    // Buscar usuário na tabela users (source of truth)
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (dbError || !dbUser) {
      throw new Error(`Usuário ${email} não encontrado na tabela users`)
    }

    console.log('[sync-user-data] Usuário encontrado:', dbUser.role)
    
    // Buscar usuário na tabela auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      throw authError
    }

    const targetUser = authUsers.users.find(user => user.email === email)
    
    if (!targetUser) {
      throw new Error(`Usuário ${email} não encontrado no auth.users`)
    }
    
    // Sincronizar metadados
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
      throw updateError
    }

    console.log('[sync-user-data] Sincronização concluída com sucesso')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dados sincronizados com sucesso',
        user: { 
          id: updatedUser.user.id, 
          email: updatedUser.user.email,
          role: dbUser.role,
          synced: true
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[sync-user-data] Erro:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
