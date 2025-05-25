
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
    user_role?: string;
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

  console.log('🚀 INDEXA AUTH HOOK - VERSÃO CORRIGIDA - Interceptando token JWT');

  try {
    // VALIDAÇÃO CRÍTICA: Verificar se é uma requisição válida
    if (req.method !== 'POST') {
      console.error('❌ Método não permitido:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    // VALIDAÇÃO CRÍTICA: Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      });
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // VALIDAÇÃO CRÍTICA: Verificar payload
    let payload: WebhookPayload;
    try {
      const rawPayload = await req.text();
      console.log('📦 Raw payload recebido:', rawPayload.substring(0, 200) + '...');
      
      payload = JSON.parse(rawPayload);
      
      if (!payload || !payload.user || !payload.token) {
        console.error('❌ Payload inválido - estrutura incorreta:', { 
          hasPayload: !!payload, 
          hasUser: !!payload?.user, 
          hasToken: !!payload?.token 
        });
        return new Response(JSON.stringify({ error: 'Invalid payload structure' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    } catch (parseError) {
      console.error('❌ Erro ao fazer parse do JSON:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    console.log('📦 INDEXA AUTH - Payload validado:', { 
      type: payload.type, 
      userId: payload.user.id, 
      email: payload.user.email,
      timestamp: new Date().toISOString()
    });

    // CORREÇÃO ESPECÍFICA PARA SUPER ADMIN INDEXA
    if (payload.user.email === 'jefersonstilver@gmail.com') {
      payload.token.user_role = 'super_admin';
      console.log('👑 INDEXA SUPER ADMIN - Role FORÇADA para super_admin:', {
        email: payload.user.email,
        role: 'super_admin',
        userId: payload.user.id
      });
      
      // Log evento super admin
      try {
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'super_admin_forced_access',
            descricao: `INDEXA Super Admin role forçada para: ${payload.user.email}`,
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown'
          });
      } catch (logError) {
        console.warn('⚠️ Erro ao registrar log (não crítico):', logError);
      }
    } else {
      // Para outros usuários, buscar role na tabela
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, email')
          .eq('id', payload.user.id)
          .single();

        if (error) {
          console.warn('⚠️ Erro ao buscar role (usando client como padrão):', error);
          payload.token.user_role = 'client';
        } else {
          payload.token.user_role = userData.role || 'client';
          console.log('✅ Role encontrada na tabela users:', {
            email: userData.email,
            role: userData.role,
            userId: payload.user.id
          });
        }
      } catch (dbError) {
        console.warn('⚠️ Erro na consulta ao banco (usando client como padrão):', dbError);
        payload.token.user_role = 'client';
      }
    }

    // Log final do JWT modificado
    console.log('🎯 INDEXA AUTH - JWT FINAL CORRIGIDO:', {
      user_role: payload.token.user_role,
      email: payload.user.email,
      user_id: payload.user.id,
      timestamp: new Date().toISOString(),
      success: true
    });

    // Log evento de autenticação para auditoria
    try {
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'auth_hook_success',
          descricao: `Auth Hook executado com sucesso - Role: ${payload.token.user_role} para usuário: ${payload.user.email}`,
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        });
    } catch (logError) {
      console.warn('⚠️ Erro ao registrar log de sucesso (não crítico):', logError);
    }

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 INDEXA AUTH HOOK - ERRO CRÍTICO CAPTURADO:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Log erro crítico
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'auth_hook_critical_error',
            descricao: `INDEXA Auth Hook ERRO CRÍTICO: ${error.message}`,
            ip: req.headers.get('x-forwarded-for') || 'unknown',
            user_agent: req.headers.get('user-agent') || 'unknown'
          });
      }
    } catch (logError) {
      console.error('💥 Erro ao registrar log crítico:', logError);
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
