import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate cryptographically secure token
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Generate secure password with complexity requirements
function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + specialChars;
  
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Rate limiting storage with IP tracking
const rateLimitAttempts = new Map<string, { attempts: number[]; blocked: boolean; blockUntil?: number }>();

function checkRateLimit(ip: string, maxAttempts: number = 3, windowMs: number = 900000): boolean {
  const now = Date.now();
  const record = rateLimitAttempts.get(ip) || { attempts: [], blocked: false };
  
  // Check if currently blocked
  if (record.blocked && record.blockUntil && now < record.blockUntil) {
    return false;
  }
  
  // Clear block if expired
  if (record.blocked && record.blockUntil && now >= record.blockUntil) {
    record.blocked = false;
    record.blockUntil = undefined;
    record.attempts = [];
  }
  
  // Remove old attempts
  const recentAttempts = record.attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    // Block the IP
    record.blocked = true;
    record.blockUntil = now + windowMs;
    rateLimitAttempts.set(ip, record);
    return false;
  }
  
  recentAttempts.push(now);
  record.attempts = recentAttempts;
  rateLimitAttempts.set(ip, record);
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Enhanced rate limiting
    if (!checkRateLimit(clientIP)) {
      console.error(`[SECURITY] Rate limit exceeded for IP: ${clientIP}`);
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

    // Verify secure token (must be set in Supabase secrets)
    const expectedToken = Deno.env.get('EMERGENCY_RESET_TOKEN')
    if (!expectedToken || secureToken !== expectedToken) {
      // Log security violation
      console.error(`[SECURITY] Invalid emergency token attempt from ${clientIP} for email ${email}`)
      
      // Log to database
      await supabaseAdmin
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'SECURITY_VIOLATION',
          descricao: `Invalid emergency reset token attempt for ${email}`,
          ip: clientIP
        });
      
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
      // Don't reveal if user exists or not for security
      console.error(`[SECURITY] Emergency reset attempt for non-existent user: ${email}`)
      throw new Error('Operação não autorizada')
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
          emergency_reset: true
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

    // Log successful security event
    await supabaseAdmin
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'SECURE_EMERGENCY_RESET',
        descricao: `Reset de emergência seguro realizado para ${email} via IP ${clientIP}`,
        ip: clientIP,
        user_id: targetUser.id
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
