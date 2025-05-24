
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'token';
  token: {
    aud: string;
    exp: number;
    iat: number;
    sub: string;
    email?: string;
    phone?: string;
    app_metadata: {
      provider?: string;
      providers?: string[];
    };
    user_metadata: {
      [key: string]: any;
    };
    role?: string;
    aal?: string;
    amr?: Array<{ method: string; timestamp: number }>;
    session_id?: string;
  };
  user: {
    id: string;
    aud: string;
    role?: string;
    email?: string;
    email_confirmed_at?: string;
    phone?: string;
    confirmed_at?: string;
    last_sign_in_at?: string;
    app_metadata: {
      provider?: string;
      providers?: string[];
    };
    user_metadata: {
      [key: string]: any;
    };
    identities?: Array<{
      id: string;
      user_id: string;
      identity_data?: {
        [key: string]: any;
      };
      provider: string;
      created_at?: string;
      last_sign_in_at?: string;
    }>;
    created_at: string;
    updated_at?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔥 PHOENIX AUTH HOOK - Interceptando token JWT');

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    console.log('📦 Payload recebido:', { 
      type: payload.type, 
      userId: payload.user.id, 
      email: payload.user.email 
    });

    // Buscar role do usuário na tabela users
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', payload.user.id)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar role do usuário:', error);
      // Se não encontrar, define como 'client' por padrão
      payload.token.user_role = 'client';
    } else {
      payload.token.user_role = userData.role;
      console.log('✅ Role encontrada e injetada:', userData.role);
    }

    // VERIFICAÇÃO CRÍTICA: Super Admin
    if (payload.user.email === 'jefersonstilver@gmail.com') {
      payload.token.user_role = 'super_admin';
      console.log('👑 SUPER ADMIN CONFIRMADO - Role forçada para super_admin');
    }

    console.log('🚀 JWT modificado com user_role:', payload.token.user_role);

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 Erro no Auth Hook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
