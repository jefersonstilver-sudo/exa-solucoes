import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the caller is a super_admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is super_admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only super_admin can execute this action' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔴 FORCE LOGOUT ALL initiated by super_admin: ${user.email}`)

    // Parse request body for options
    let excludeCurrentUser = false
    try {
      const body = await req.json()
      excludeCurrentUser = body?.excludeCurrentUser ?? false
    } catch {
      // No body or invalid JSON, use defaults
    }

    // 1. Mark all sessions as inactive in user_sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        terminated_at: new Date().toISOString(),
        terminated_by: user.id
      })
      .neq('is_active', false) // Only update active sessions
      .select('session_id, user_id')

    if (sessionsError) {
      console.error('Error deactivating sessions:', sessionsError)
    }

    const sessionsTerminated = sessionsData?.length || 0
    console.log(`✅ Terminated ${sessionsTerminated} active sessions`)

    // 2. Get all users (except current if excluded)
    let usersQuery = supabase.auth.admin.listUsers()
    const { data: usersData, error: usersError } = await usersQuery

    if (usersError) {
      console.error('Error listing users:', usersError)
      throw usersError
    }

    let usersLoggedOut = 0
    const errors: string[] = []

    // 3. Sign out each user (revoke refresh tokens)
    for (const authUser of (usersData?.users || [])) {
      // Skip current user if requested
      if (excludeCurrentUser && authUser.id === user.id) {
        console.log(`⏭️ Skipping current user: ${authUser.email}`)
        continue
      }

      try {
        // Revoke all refresh tokens for this user
        const { error: signOutError } = await supabase.auth.admin.signOut(authUser.id, 'global')
        
        if (signOutError) {
          console.error(`Error signing out ${authUser.email}:`, signOutError)
          errors.push(`${authUser.email}: ${signOutError.message}`)
        } else {
          usersLoggedOut++
          console.log(`✅ Signed out: ${authUser.email}`)
        }
      } catch (err) {
        console.error(`Exception signing out ${authUser.email}:`, err)
        errors.push(`${authUser.email}: ${err.message}`)
      }
    }

    // 4. Also clear active_sessions_monitor table
    const { error: monitorError } = await supabase
      .from('active_sessions_monitor')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .neq('is_active', false)

    if (monitorError) {
      console.error('Error updating active_sessions_monitor:', monitorError)
    }

    // 5. Log the emergency action
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'EMERGENCY_FORCE_LOGOUT_ALL',
      descricao: `🚨 EMERGÊNCIA: Super Admin ${user.email} executou logout forçado de todas as contas. ${usersLoggedOut} usuários deslogados, ${sessionsTerminated} sessões encerradas.`
    })

    console.log(`🔴 FORCE LOGOUT COMPLETE: ${usersLoggedOut} users, ${sessionsTerminated} sessions`)

    return new Response(
      JSON.stringify({
        success: true,
        usersLoggedOut,
        sessionsTerminated,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully logged out ${usersLoggedOut} users and terminated ${sessionsTerminated} sessions`,
        executedBy: user.email,
        executedAt: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('🔴 FORCE LOGOUT ERROR:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
