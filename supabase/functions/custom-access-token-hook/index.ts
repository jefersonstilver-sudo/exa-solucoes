
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔐 SECURE AUTH HOOK - Intercepting JWT token');

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
        return new Response(JSON.stringify({ error: 'Invalid payload structure' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    console.log('✅ Auth payload validated for user:', payload.claims.email);

    // Secure role lookup from database only
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', payload.user_id)
        .single();

      if (error) {
        console.warn('⚠️ Error fetching user role, defaulting to client:', error);
        payload.claims.user_role = 'client';
      } else {
        payload.claims.user_role = userData.role || 'client';
        console.log('✅ Role retrieved from database:', {
          email: userData.email,
          role: userData.role,
          userId: payload.user_id
        });
      }
    } catch (dbError) {
      console.warn('⚠️ Database error, defaulting to client role:', dbError);
      payload.claims.user_role = 'client';
    }

    // Audit log for all authentication events
    try {
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'secure_auth_token_generated',
          descricao: `Secure token generated for user: ${payload.claims.email} with role: ${payload.claims.user_role}`,
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        });
    } catch (logError) {
      console.warn('⚠️ Failed to log auth event (non-critical):', logError);
    }

    console.log('🎯 Secure JWT generated:', {
      user_role: payload.claims.user_role,
      email: payload.claims.email,
      user_id: payload.user_id,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 Critical auth error:', {
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'auth_hook_critical_error',
            descricao: `Critical auth error: ${error.message}`,
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown'
          });
      }
    } catch (logError) {
      console.error('💥 Failed to log critical error:', logError);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
