
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SupabaseAuthHookPayload {
  user_id: string;
  claims: {
    iss: string;
    sub: string;
    aud: string[] | string;
    exp: number;
    iat: number;
    email?: string;
    phone?: string;
    app_metadata?: {
      provider?: string;
      providers?: string[];
    };
    user_metadata?: {
      [key: string]: any;
    };
    role?: string;
    aal?: string;
    amr?: Array<{ method: string; timestamp: number }>;
    session_id?: string;
    user_role?: string;
  };
}

Deno.serve(async (req) => {
  console.log('🔐 [AUTH-HOOK-FIXED] Processing request - VERSÃO CORRIGIDA');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      console.error('❌ [AUTH-HOOK-FIXED] Method not allowed:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [AUTH-HOOK-FIXED] Missing environment variables');
      return new Response(JSON.stringify({ 
        claims: { user_role: 'client' },
        error: 'Missing env vars but allowing login'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let payload: SupabaseAuthHookPayload;
    try {
      const rawPayload = await req.text();
      console.log('📦 [AUTH-HOOK-FIXED] Processing auth payload');
      payload = JSON.parse(rawPayload);
      
      if (!payload || !payload.user_id || !payload.claims) {
        console.error('❌ [AUTH-HOOK-FIXED] Invalid payload structure');
        // Return the original payload to not break auth flow
        return new Response(JSON.stringify(payload || { claims: { user_role: 'client' } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    } catch (parseError) {
      console.error('❌ [AUTH-HOOK-FIXED] JSON parse error:', parseError);
      // Return minimal valid claims to not break auth flow
      return new Response(JSON.stringify({ claims: { user_role: 'client' } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    console.log('✅ [AUTH-HOOK-FIXED] Auth payload validated for user:', payload.claims.email);

    // Try to get role from database with timeout
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 3000)
      );
      
      const dbPromise = supabase
        .from('users')
        .select('role, email')
        .eq('id', payload.user_id)
        .single();

      const { data: userData, error } = await Promise.race([dbPromise, timeoutPromise]) as any;

      if (error) {
        console.warn('⚠️ [AUTH-HOOK-FIXED] Error fetching user role, using default:', error.message);
        payload.claims.user_role = 'client';
      } else if (userData?.role) {
        payload.claims.user_role = userData.role;
        console.log('✅ [AUTH-HOOK-FIXED] Role retrieved from database:', userData.role);
      } else {
        console.warn('⚠️ [AUTH-HOOK-FIXED] No role found, using default');
        payload.claims.user_role = 'client';
      }
    } catch (dbError) {
      console.warn('⚠️ [AUTH-HOOK-FIXED] Database error, using default role:', dbError);
      payload.claims.user_role = 'client';
    }

    console.log('🎯 [AUTH-HOOK-FIXED] JWT generated successfully:', {
      user_role: payload.claims.user_role,
      email: payload.claims.email,
      user_id: payload.user_id
    });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 [AUTH-HOOK-FIXED] Critical auth error:', error);
    
    // IMPORTANT: Never break the auth flow, return minimal valid response
    return new Response(JSON.stringify({ 
      claims: { user_role: 'client' },
      error: 'Auth hook error but login allowed',
      fixed_version: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Always return 200 to not break auth
    });
  }
});
