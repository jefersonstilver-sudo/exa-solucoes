
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

    console.log('[emergency-admin-reset] Iniciando reset de emergência')
    
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

    const { email, newPassword } = await req.json()
    
    if (!email || !newPassword) {
      throw new Error('Email e nova senha são obrigatórios')
    }

    // Find the user by email
    console.log('[emergency-admin-reset] Buscando usuário:', email)
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('[emergency-admin-reset] Erro ao listar usuários:', authError)
      throw authError
    }

    const targetUser = authUsers.users.find(user => user.email === email)
    
    if (!targetUser) {
      throw new Error(`Usuário com email ${email} não encontrado`)
    }

    console.log('[emergency-admin-reset] Usuário encontrado, resetando senha...')
    
    // Force password reset
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        password: newPassword,
        email_confirm: true,
      }
    )

    if (updateError) {
      console.error('[emergency-admin-reset] Erro ao atualizar senha:', updateError)
      throw updateError
    }

    console.log('[emergency-admin-reset] Senha resetada com sucesso para:', email)

    return new Response(
      JSON.stringify({
        message: 'Senha resetada com sucesso',
        user: { id: updatedUser.user.id, email: updatedUser.user.email }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[emergency-admin-reset] Erro crítico:', error)
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
