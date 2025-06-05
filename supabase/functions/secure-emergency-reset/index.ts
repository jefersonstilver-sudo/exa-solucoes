
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate cryptographically secure token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate secure password
function generateSecurePassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

// Rate limiting storage
const rateLimitAttempts = new Map<string, number[]>();

function checkRateLimit(ip: string, maxAttempts: number = 3, windowMs: number = 900000): boolean {
  const now = Date.now();
  const attempts = rateLimitAttempts.get(ip) || [];
  
  // Remove old attempts
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false;
  }
  
  recentAttempts.push(now);
  rateLimitAttempts.set(ip, recentAttempts);
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Muitas tentativas. Tente novamente em 15 minutos.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Configuração do servidor incompleta')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const { email, secureToken } = await req.json()
    
    if (!email || !secureToken) {
      throw new Error('Email e token de segurança são obrigatórios')
    }

    // Verify secure token (this should be generated and sent via secure channel)
    const expectedToken = Deno.env.get('EMERGENCY_RESET_TOKEN')
    if (!expectedToken || secureToken !== expectedToken) {
      // Log security violation
      console.error(`[SECURITY] Invalid emergency token attempt from ${clientIP} for email ${email}`)
      throw new Error('Token de segurança inválido')
    }

    // Generate new secure password
    const newPassword = generateSecurePassword(16);

    console.log('[secure-emergency-reset] Iniciando reset seguro para:', email)
    
    // Find user
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('[secure-emergency-reset] Erro ao listar usuários:', authError)
      throw authError
    }

    const targetUser = authUsers.users.find(user => user.email === email)
    
    if (!targetUser) {
      throw new Error(`Usuário com email ${email} não encontrado`)
    }

    // Reset password with force email confirmation reset
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          ...targetUser.user_metadata,
          password_reset_required: true,
          password_reset_at: new Date().toISOString(),
        },
      }
    )

    if (updateError) {
      console.error('[secure-emergency-reset] Erro ao atualizar senha:', updateError)
      throw updateError
    }

    // Update users table if needed
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', targetUser.id)
      .single()

    if (!dbUser) {
      await supabaseAdmin
        .from('users')
        .insert({
          id: targetUser.id,
          email: email,
          role: 'super_admin'
        })
    }

    // Log security event
    await supabaseAdmin
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'SECURE_EMERGENCY_RESET',
        descricao: `Reset de emergência seguro realizado para ${email} via IP ${clientIP}`,
        ip: clientIP
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reset de emergência realizado com sucesso',
        user: { 
          id: updatedUser.user.id, 
          email: updatedUser.user.email,
        },
        temporary_password: newPassword,
        warning: 'ALTERE ESTA SENHA IMEDIATAMENTE APÓS O LOGIN',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[secure-emergency-reset] Erro:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
