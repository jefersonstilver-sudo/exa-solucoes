
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

    console.log('[emergency-password-reset] Iniciando reset de emergência')
    
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

    const { email, newPassword, confirmationCode } = await req.json()
    
    // Código de confirmação simples para segurança
    if (confirmationCode !== 'EMERGENCY_RESET_2024') {
      throw new Error('Código de confirmação inválido')
    }

    if (!email || !newPassword) {
      throw new Error('Email e nova senha são obrigatórios')
    }

    console.log('[emergency-password-reset] Buscando usuário:', email)
    
    // Buscar usuário pelo email
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('[emergency-password-reset] Erro ao listar usuários:', authError)
      throw authError
    }

    const targetUser = authUsers.users.find(user => user.email === email)
    
    if (!targetUser) {
      throw new Error(`Usuário com email ${email} não encontrado`)
    }

    console.log('[emergency-password-reset] Usuário encontrado, ID:', targetUser.id)
    
    // Resetar senha
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          role: 'super_admin',
          name: 'Jefferson Silver',
        },
      }
    )

    if (updateError) {
      console.error('[emergency-password-reset] Erro ao atualizar senha:', updateError)
      throw updateError
    }

    console.log('[emergency-password-reset] Senha resetada com sucesso')

    // Verificar se usuário existe na tabela users
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', targetUser.id)
      .single()

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('[emergency-password-reset] Erro ao verificar usuário na tabela users:', dbError)
    }

    if (!dbUser) {
      // Inserir usuário na tabela users se não existir
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: targetUser.id,
          email: email,
          role: 'super_admin'
        })

      if (insertError) {
        console.error('[emergency-password-reset] Erro ao inserir usuário:', insertError)
        // Não falhar aqui, pois o reset de senha já funcionou
      } else {
        console.log('[emergency-password-reset] Usuário inserido na tabela users')
      }
    } else if (dbUser.role !== 'super_admin') {
      // Atualizar role se necessário
      const { error: updateRoleError } = await supabaseAdmin
        .from('users')
        .update({ role: 'super_admin' })
        .eq('id', targetUser.id)

      if (updateRoleError) {
        console.error('[emergency-password-reset] Erro ao atualizar role:', updateRoleError)
      } else {
        console.log('[emergency-password-reset] Role atualizada para super_admin')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Senha resetada com sucesso',
        user: { 
          id: updatedUser.user.id, 
          email: updatedUser.user.email,
          role: 'super_admin'
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[emergency-password-reset] Erro crítico:', error)
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
