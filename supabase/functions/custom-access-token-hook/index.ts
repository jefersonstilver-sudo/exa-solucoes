
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// INTERFACE CORRIGIDA para o formato REAL do payload que o Supabase envia
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🚀 INDEXA AUTH HOOK - VERSÃO FINAL CORRIGIDA - Interceptando token JWT');

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

    // VALIDAÇÃO CRÍTICA: Verificar payload CORRIGIDA
    let payload: SupabaseAuthHookPayload;
    try {
      const rawPayload = await req.text();
      console.log('📦 Raw payload recebido:', rawPayload.substring(0, 500) + '...');
      
      payload = JSON.parse(rawPayload);
      
      // VALIDAÇÃO FLEXÍVEL - aceitar o formato real do Supabase
      if (!payload || !payload.user_id || !payload.claims) {
        console.error('❌ Payload inválido - estrutura incorreta:', { 
          hasPayload: !!payload, 
          hasUserId: !!payload?.user_id, 
          hasClaims: !!payload?.claims 
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
    
    console.log('📦 INDEXA AUTH - Payload CORRIGIDO validado:', { 
      user_id: payload.user_id, 
      email: payload.claims.email,
      timestamp: new Date().toISOString()
    });

    // CORREÇÃO ESPECÍFICA PARA SUPER ADMIN INDEXA
    if (payload.claims.email === 'jefersonstilver@gmail.com') {
      payload.claims.user_role = 'super_admin';
      console.log('👑 INDEXA SUPER ADMIN - Role FORÇADA para super_admin:', {
        email: payload.claims.email,
        role: 'super_admin',
        userId: payload.user_id
      });
      
      // Log evento super admin
      try {
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'super_admin_forced_access',
            descricao: `INDEXA Super Admin role forçada para: ${payload.claims.email}`,
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
          .eq('id', payload.user_id)
          .single();

        if (error) {
          console.warn('⚠️ Erro ao buscar role (usando client como padrão):', error);
          payload.claims.user_role = 'client';
        } else {
          payload.claims.user_role = userData.role || 'client';
          console.log('✅ Role encontrada na tabela users:', {
            email: userData.email,
            role: userData.role,
            userId: payload.user_id
          });
        }
      } catch (dbError) {
        console.warn('⚠️ Erro na consulta ao banco (usando client como padrão):', dbError);
        payload.claims.user_role = 'client';
      }
    }

    // Log final do JWT modificado
    console.log('🎯 INDEXA AUTH - JWT FINAL CORRIGIDO:', {
      user_role: payload.claims.user_role,
      email: payload.claims.email,
      user_id: payload.user_id,
      timestamp: new Date().toISOString(),
      success: true
    });

    // Log evento de autenticação para auditoria
    try {
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'auth_hook_success',
          descricao: `Auth Hook CORRIGIDO executado com sucesso - Role: ${payload.claims.user_role} para usuário: ${payload.claims.email}`,
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        });
    } catch (logError) {
      console.warn('⚠️ Erro ao registrar log de sucesso (não crítico):', logError);
    }

    // RETORNO NO FORMATO CORRETO ESPERADO PELO SUPABASE
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
            descricao: `INDEXA Auth Hook ERRO CRÍTICO CORRIGIDO: ${error.message}`,
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
