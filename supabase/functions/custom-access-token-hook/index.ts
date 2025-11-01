
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
  console.log('🔐 AUTH HOOK: Processing request');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      console.error('❌ Method not allowed:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables');
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let payload: SupabaseAuthHookPayload;
    try {
      const rawPayload = await req.text();
      console.log('📦 Processing auth payload');
      payload = JSON.parse(rawPayload);
      
      if (!payload || !payload.user_id || !payload.claims) {
        console.error('❌ Invalid payload structure');
        // Return the original payload to not break auth flow
        return new Response(JSON.stringify(payload || {}), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      // Return empty claims to not break auth flow
      return new Response(JSON.stringify({ claims: {} }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    console.log('✅ Auth payload validated for user:', payload.claims.email);

    // Try to get role from user_roles table (SECURE - separate from users table)
    try {
      const { data: userRoleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', payload.user_id)
        .single();

      if (error) {
        console.warn('⚠️ Error fetching user role, using default:', error.message);
        payload.claims.user_role = 'client';
      } else if (userRoleData?.role) {
        payload.claims.user_role = userRoleData.role;
        console.log('✅ Role retrieved from user_roles table:', userRoleData.role);
      } else {
        console.warn('⚠️ No role found in user_roles, using default');
        payload.claims.user_role = 'client';
      }
    } catch (dbError) {
      console.warn('⚠️ Database error, using default role:', dbError);
      payload.claims.user_role = 'client';
    }

    console.log('🎯 JWT generated successfully:', {
      user_role: payload.claims.user_role,
      email: payload.claims.email,
      user_id: payload.user_id
    });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 Critical auth error:', error);
    
    // IMPORTANT: Never break the auth flow, return minimal valid response
    return new Response(JSON.stringify({ 
      claims: { user_role: 'client' },
      error: 'Auth hook error but login allowed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Always return 200 to not break auth
    });
  }
});
