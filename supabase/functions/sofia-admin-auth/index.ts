import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Admin phone for verification (Jeferson)
const ADMIN_PHONE = '5511999999999'; // Will be fetched from exa_alerts_directors

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Session duration in minutes
const SESSION_DURATION_MINUTES = 5;

// ==================== ACTION HANDLERS ====================

async function requestVerificationCode(userPhone: string, userName?: string): Promise<{ success: boolean; message: string }> {
  console.log('[SOFIA-ADMIN-AUTH] Requesting verification code for:', userPhone);
  
  try {
    // Get admin director info (Jeferson)
    const { data: directors } = await supabase
      .from('exa_alerts_directors')
      .select('telefone, nome')
      .eq('ativo', true)
      .limit(1);
    
    if (!directors || directors.length === 0) {
      console.error('[SOFIA-ADMIN-AUTH] No active directors found');
      return { success: false, message: 'Nenhum administrador configurado para receber códigos.' };
    }
    
    const adminPhoneRaw = directors[0].telefone;
    const adminName = directors[0].nome;

    const normalizePhoneE164BR = (phone: string) => {
      const digits = (phone || '').replace(/\D/g, '');
      if (!digits) return '';
      // If already has country code
      if (digits.startsWith('55') && digits.length >= 12) return digits;
      // If looks like BR mobile/landline (10-11 digits), prefix 55
      if (digits.length === 10 || digits.length === 11) return `55${digits}`;
      // Fallback: return as-is digits
      return digits;
    };

    const adminPhone = normalizePhoneE164BR(adminPhoneRaw);

    if (!adminPhone) {
      console.error('[SOFIA-ADMIN-AUTH] Invalid admin phone:', adminPhoneRaw);
      return { success: false, message: 'Telefone do administrador inválido. Atualize o cadastro do diretor.' };
    }

    // Generate code
    const code = generateCode();

    // Invalidate any existing active sessions for this phone
    await supabase
      .from('sofia_admin_sessions')
      .update({ session_active: false })
      .eq('user_phone', userPhone)
      .eq('session_active', true);

    // Create new session record
    const { data: session, error: sessionError } = await supabase
      .from('sofia_admin_sessions')
      .insert({
        user_phone: userPhone,
        user_name: userName || 'Admin',
        verification_code: code,
        code_sent_at: new Date().toISOString(),
        session_active: false
      })
      .select()
      .single();

    if (sessionError) {
      console.error('[SOFIA-ADMIN-AUTH] Error creating session:', sessionError);
      return { success: false, message: 'Erro ao criar sessão de verificação.' };
    }

    // Send code via Z-API (using EXA Alert system)
    const message = `🔐 *CÓDIGO DE VERIFICAÇÃO SOFIA*\n\n` +
      `Código: *${code}*\n\n` +
      `Solicitado por: ${userName || userPhone}\n` +
      `Válido por: 5 minutos\n\n` +
      `⚠️ Este código libera acesso ao Modo Gerente Master da Sofia.\n` +
      `Não compartilhe com ninguém.`;

    // Get agent config for EXA Alert
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('key', 'exa_alert')
      .eq('whatsapp_provider', 'zapi')
      .single();

    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!agent?.zapi_config || !zapiClientToken) {
      console.error('[SOFIA-ADMIN-AUTH] Missing Z-API config/token. zapi_config:', !!agent?.zapi_config, 'hasClientToken:', !!zapiClientToken);
      return { success: false, message: 'Z-API não configurado para envio do código. Verifique a integração do EXA Alerts.' };
    }

    const zapiConfig = agent.zapi_config;
    const sendUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;

    console.log('[SOFIA-ADMIN-AUTH] Sending code to admin phone:', adminPhone);

    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': zapiClientToken,
      },
      body: JSON.stringify({
        phone: adminPhone,
        message: message
      })
    });

    if (!response.ok) {
      const respText = await response.text();
      console.error('[SOFIA-ADMIN-AUTH] Failed to send WhatsApp:', respText);
      return { success: false, message: 'Falha ao enviar o código por WhatsApp. Tente novamente em instantes.' };
    }

    console.log('[SOFIA-ADMIN-AUTH] Code sent via WhatsApp to:', adminName);

    
    // Log the request
    await supabase.from('agent_logs').insert({
      agent_key: 'sofia',
      event_type: 'admin_code_requested',
      metadata: {
        session_id: session.id,
        user_phone: userPhone,
        admin_notified: adminName,
        timestamp: new Date().toISOString()
      }
    });
    
    return { 
      success: true, 
      message: `Código de verificação enviado para ${adminName}. Aguarde receber o código e repita-o para mim.`
    };
    
  } catch (error) {
    console.error('[SOFIA-ADMIN-AUTH] Error:', error);
    return { success: false, message: 'Erro ao enviar código de verificação.' };
  }
}

async function verifyCode(userPhone: string, code: string): Promise<{ success: boolean; message: string; session_id?: string }> {
  console.log('[SOFIA-ADMIN-AUTH] Verifying code for:', userPhone);
  
  try {
    // Find pending session with this code
    const { data: sessions, error } = await supabase
      .from('sofia_admin_sessions')
      .select('*')
      .eq('user_phone', userPhone)
      .eq('verification_code', code)
      .eq('session_active', false)
      .gte('code_sent_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Code valid for 5 min
      .order('code_sent_at', { ascending: false })
      .limit(1);
    
    if (error || !sessions || sessions.length === 0) {
      console.log('[SOFIA-ADMIN-AUTH] Invalid or expired code');
      return { success: false, message: 'Código inválido ou expirado. Solicite um novo código.' };
    }
    
    const session = sessions[0];
    
    // Activate session
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MINUTES * 60 * 1000);
    
    await supabase
      .from('sofia_admin_sessions')
      .update({
        session_active: true,
        code_verified_at: new Date().toISOString(),
        session_expires_at: expiresAt.toISOString()
      })
      .eq('id', session.id);
    
    // Log activation
    await supabase.from('agent_logs').insert({
      agent_key: 'sofia',
      event_type: 'admin_session_activated',
      metadata: {
        session_id: session.id,
        user_phone: userPhone,
        expires_at: expiresAt.toISOString(),
        timestamp: new Date().toISOString()
      }
    });
    
    return { 
      success: true, 
      message: `Modo Gerente Master ativado! Você tem ${SESSION_DURATION_MINUTES} minutos de acesso total. O que deseja consultar?`,
      session_id: session.id
    };
    
  } catch (error) {
    console.error('[SOFIA-ADMIN-AUTH] Verify error:', error);
    return { success: false, message: 'Erro ao verificar código.' };
  }
}

async function checkSession(userPhone: string): Promise<{ active: boolean; expires_in_minutes?: number; session_id?: string }> {
  console.log('[SOFIA-ADMIN-AUTH] Checking session for:', userPhone);
  
  try {
    const { data: sessions } = await supabase
      .from('sofia_admin_sessions')
      .select('*')
      .eq('user_phone', userPhone)
      .eq('session_active', true)
      .gte('session_expires_at', new Date().toISOString())
      .order('session_expires_at', { ascending: false })
      .limit(1);
    
    if (!sessions || sessions.length === 0) {
      return { active: false };
    }
    
    const session = sessions[0];
    const expiresAt = new Date(session.session_expires_at);
    const minutesRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);
    
    return { 
      active: true, 
      expires_in_minutes: minutesRemaining,
      session_id: session.id
    };
    
  } catch (error) {
    console.error('[SOFIA-ADMIN-AUTH] Check session error:', error);
    return { active: false };
  }
}

async function endSession(userPhone: string): Promise<{ success: boolean; message: string }> {
  console.log('[SOFIA-ADMIN-AUTH] Ending session for:', userPhone);
  
  try {
    await supabase
      .from('sofia_admin_sessions')
      .update({ session_active: false })
      .eq('user_phone', userPhone)
      .eq('session_active', true);
    
    // Log end
    await supabase.from('agent_logs').insert({
      agent_key: 'sofia',
      event_type: 'admin_session_ended',
      metadata: {
        user_phone: userPhone,
        ended_by: 'user_request',
        timestamp: new Date().toISOString()
      }
    });
    
    return { success: true, message: 'Sessão administrativa encerrada. Até a próxima!' };
    
  } catch (error) {
    console.error('[SOFIA-ADMIN-AUTH] End session error:', error);
    return { success: false, message: 'Erro ao encerrar sessão.' };
  }
}

async function logAdminQuery(sessionId: string, queryType: string, params: any, response: any, durationMs: number): Promise<void> {
  try {
    await supabase.from('sofia_admin_access_logs').insert({
      session_id: sessionId,
      query_type: queryType,
      query_params: params,
      response_summary: typeof response === 'string' ? response.substring(0, 500) : JSON.stringify(response).substring(0, 500),
      response_data: response,
      duration_ms: durationMs
    });
  } catch (error) {
    console.error('[SOFIA-ADMIN-AUTH] Log query error:', error);
  }
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  console.log(`[SOFIA-ADMIN-AUTH] ${req.method} request at ${new Date().toISOString()}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Sofia Admin Auth service is running',
      version: '1.0'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await req.json();
    const { action, user_phone, user_name, code, session_id, query_type, query_params, query_response, duration_ms } = body;
    
    console.log('[SOFIA-ADMIN-AUTH] Action:', action, 'Phone:', user_phone);
    
    let result: any;
    
    switch (action) {
      case 'request_code':
        result = await requestVerificationCode(user_phone, user_name);
        break;
        
      case 'verify_code':
        result = await verifyCode(user_phone, code);
        break;
        
      case 'check_session':
        result = await checkSession(user_phone);
        break;
        
      case 'end_session':
        result = await endSession(user_phone);
        break;
        
      case 'log_query':
        await logAdminQuery(session_id, query_type, query_params, query_response, duration_ms);
        result = { success: true };
        break;
        
      default:
        result = { success: false, message: `Ação desconhecida: ${action}` };
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[SOFIA-ADMIN-AUTH] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro interno no serviço de autenticação.',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
