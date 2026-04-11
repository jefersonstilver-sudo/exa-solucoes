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

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Session duration in minutes (increased to 10 minutes for better usability)
const SESSION_DURATION_MINUTES = 10;
// Extension duration when activity is detected (in minutes)
const SESSION_EXTENSION_MINUTES = 5;

// ==================== ACTION HANDLERS ====================

// Verificar se 2FA está ativado nas configurações
async function is2FAEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('configuracoes_adicionais')
      .select('sofia_2fa_gerente_master')
      .limit(1)
      .single();
    
    if (error) {
      console.log('🔐 [ADMIN-AUTH] ⚠️ Erro ao buscar config 2FA, usando padrão true:', error.message);
      return true; // Default to requiring 2FA if can't check
    }
    
    const is2FA = data?.sofia_2fa_gerente_master ?? true;
    console.log(`🔐 [ADMIN-AUTH] Config sofia_2fa_gerente_master: ${is2FA}`);
    return is2FA;
  } catch (error) {
    console.error('🔐 [ADMIN-AUTH] ❌ Erro fatal ao verificar 2FA:', error);
    return true; // Default to requiring 2FA on error
  }
}

// Ativar sessão diretamente sem 2FA (quando 2FA está desativado)
async function activateSessionDirectly(userPhone: string, userName?: string): Promise<{ success: boolean; message: string; session_id?: string }> {
  console.log('\n🔓 ═══════════════════════════════════════════════════════');
  console.log('🔓 [ADMIN-AUTH] ACTIVATE_DIRECT - 2FA desativado');
  console.log(`🔓 [ADMIN-AUTH] User Phone: ${userPhone}`);
  console.log('🔓 ═══════════════════════════════════════════════════════\n');
  
  try {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MINUTES * 60 * 1000);
    
    // Invalidar sessões anteriores
    await supabase
      .from('sofia_admin_sessions')
      .update({ session_active: false })
      .eq('user_phone', userPhone)
      .eq('session_active', true);
    
    // Criar sessão ativa diretamente
    const { data: session, error } = await supabase
      .from('sofia_admin_sessions')
      .insert({
        user_phone: userPhone,
        user_name: userName || 'Admin',
        verification_code: 'BYPASS_2FA',
        code_sent_at: new Date().toISOString(),
        code_verified_at: new Date().toISOString(),
        session_active: true,
        session_expires_at: expiresAt.toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('🔓 [ADMIN-AUTH] ❌ Erro ao criar sessão:', error);
      return { success: false, message: 'Erro ao ativar modo gerente master.' };
    }
    
    // Log activation
    await supabase.from('agent_logs').insert({
      agent_key: 'sofia',
      event_type: 'admin_session_activated_no_2fa',
      metadata: {
        session_id: session.id,
        user_phone: userPhone,
        expires_at: expiresAt.toISOString(),
        timestamp: new Date().toISOString()
      }
    });
    
    console.log(`🔓 [ADMIN-AUTH] ✅ Sessão ativada diretamente! Expira em: ${expiresAt.toISOString()}`);
    
    return { 
      success: true, 
      message: `Modo Gerente Master ativado! A autenticação 2FA está desativada nas configurações. Você tem ${SESSION_DURATION_MINUTES} minutos de acesso total. O que deseja consultar?`,
      session_id: session.id
    };
    
  } catch (error) {
    console.error('🔓 [ADMIN-AUTH] ❌ Erro fatal:', error);
    return { success: false, message: 'Erro ao ativar sessão.' };
  }
}

async function requestVerificationCode(userPhone?: string, userName?: string): Promise<{ success: boolean; message: string }> {
  const effectiveUserPhone = userPhone?.trim() || (userName ? `voice_${userName}` : 'voice_session');
  
  console.log('\n🔐 ═══════════════════════════════════════════════════════');
  console.log('🔐 [ADMIN-AUTH] REQUEST_CODE - Iniciando');
  console.log(`🔐 [ADMIN-AUTH] User Phone: ${effectiveUserPhone}`);
  console.log(`🔐 [ADMIN-AUTH] User Name: ${userName || 'não informado'}`);
  console.log('🔐 ═══════════════════════════════════════════════════════\n');
  
  try {
    // Get admin director info (Jeferson)
    console.log('🔐 [ADMIN-AUTH] Buscando diretores ativos...');
    const { data: directors, error: dirError } = await supabase
      .from('exa_alerts_directors')
      .select('telefone, nome')
      .eq('ativo', true)
      .limit(1);
    
    if (dirError) {
      console.error('🔐 [ADMIN-AUTH] ❌ Erro ao buscar diretores:', dirError);
    }
    
    if (!directors || directors.length === 0) {
      console.error('🔐 [ADMIN-AUTH] ❌ Nenhum diretor ativo encontrado');
      return { success: false, message: 'Nenhum administrador configurado para receber códigos.' };
    }
    
    const adminPhoneRaw = directors[0].telefone;
    const adminName = directors[0].nome;
    console.log(`🔐 [ADMIN-AUTH] ✅ Diretor encontrado: ${adminName} (${adminPhoneRaw})`);

    const normalizePhoneE164BR = (phone: string) => {
      const digits = (phone || '').replace(/\D/g, '');
      if (!digits) return '';
      if (digits.startsWith('55') && digits.length >= 12) return digits;
      if (digits.length === 10 || digits.length === 11) return `55${digits}`;
      return digits;
    };

    const adminPhone = normalizePhoneE164BR(adminPhoneRaw);
    console.log(`🔐 [ADMIN-AUTH] Telefone normalizado: ${adminPhone}`);

    if (!adminPhone) {
      console.error('🔐 [ADMIN-AUTH] ❌ Telefone inválido após normalização');
      return { success: false, message: 'Telefone do administrador inválido. Atualize o cadastro do diretor.' };
    }

    // Generate code
    const code = generateCode();
    console.log(`🔐 [ADMIN-AUTH] 🔢 Código gerado: ${code}`);

    // Invalidate any existing active sessions for this phone
    console.log('🔐 [ADMIN-AUTH] Invalidando sessões anteriores...');
    const { error: invalidateError } = await supabase
      .from('sofia_admin_sessions')
      .update({ session_active: false })
      .eq('user_phone', effectiveUserPhone)
      .eq('session_active', true);
    
    if (invalidateError) {
      console.warn('🔐 [ADMIN-AUTH] ⚠️ Erro ao invalidar sessões (continuando):', invalidateError);
    }

    // Create new session record
    console.log('🔐 [ADMIN-AUTH] Criando nova sessão...');
    const { data: session, error: sessionError } = await supabase
      .from('sofia_admin_sessions')
      .insert({
        user_phone: effectiveUserPhone,
        user_name: userName || 'Admin',
        verification_code: code,
        code_sent_at: new Date().toISOString(),
        session_active: false
      })
      .select()
      .single();

    if (sessionError) {
      console.error('🔐 [ADMIN-AUTH] ❌ Erro ao criar sessão:', sessionError);
      return { success: false, message: 'Erro ao criar sessão de verificação.' };
    }
    
    console.log(`🔐 [ADMIN-AUTH] ✅ Sessão criada: ${session.id}`);

    // Send code via Z-API
    const message = `🔐 *CÓDIGO DE VERIFICAÇÃO SOFIA*\n\n` +
      `Código: *${code}*\n\n` +
      `Solicitado por: ${userName || effectiveUserPhone}\n` +
      `Válido por: 5 minutos\n\n` +
      `⚠️ Este código libera acesso ao Modo Gerente Master da Sofia.\n` +
      `Não compartilhe com ninguém.`;

    // Get agent config for EXA Alert
    console.log('🔐 [ADMIN-AUTH] Buscando configuração Z-API...');
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', 'exa_alert')
      .eq('whatsapp_provider', 'zapi')
      .single();

    if (agentError) {
      console.error('🔐 [ADMIN-AUTH] ❌ Erro ao buscar agente exa_alert:', agentError);
    }

    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    console.log('🔐 [ADMIN-AUTH] Verificando configurações Z-API:');
    console.log(`   - Agent encontrado: ${!!agent}`);
    console.log(`   - zapi_config presente: ${!!agent?.zapi_config}`);
    console.log(`   - ZAPI_CLIENT_TOKEN presente: ${!!zapiClientToken}`);

    if (!agent?.zapi_config || !zapiClientToken) {
      console.error('🔐 [ADMIN-AUTH] ❌ Configuração Z-API incompleta');
      return { success: false, message: 'Z-API não configurado para envio do código. Verifique a integração do EXA Alerts.' };
    }

    const zapiConfig = agent.zapi_config as { instance_id: string; token: string };
    const sendUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;

    console.log(`🔐 [ADMIN-AUTH] 📤 Enviando código via WhatsApp para: ${adminPhone}`);
    console.log(`🔐 [ADMIN-AUTH] URL Z-API: ${sendUrl.replace(zapiConfig.token, '***')}`);

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

    const respText = await response.text();
    console.log(`🔐 [ADMIN-AUTH] Resposta Z-API (status ${response.status}): ${respText}`);

    if (!response.ok) {
      console.error('🔐 [ADMIN-AUTH] ❌ Falha no envio WhatsApp');
      return { success: false, message: 'Falha ao enviar o código por WhatsApp. Tente novamente em instantes.' };
    }

    console.log(`🔐 [ADMIN-AUTH] ✅ Código enviado com sucesso para ${adminName}!`);
    
    // Log the request
    await supabase.from('agent_logs').insert({
      agent_key: 'sofia',
      event_type: 'admin_code_requested',
      metadata: {
        session_id: session.id,
        user_phone: effectiveUserPhone,
        admin_notified: adminName,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('🔐 ═══════════════════════════════════════════════════════');
    console.log('🔐 [ADMIN-AUTH] REQUEST_CODE - SUCESSO');
    console.log('🔐 ═══════════════════════════════════════════════════════\n');
    
    return { 
      success: true, 
      message: `Código de verificação enviado para ${adminName}. Aguarde receber o código e repita-o para mim.`
    };
    
  } catch (error) {
    console.error('🔐 [ADMIN-AUTH] ❌ Erro fatal:', error);
    return { success: false, message: 'Erro ao enviar código de verificação.' };
  }
}

async function verifyCode(userPhone: string, code: string): Promise<{ success: boolean; message: string; session_id?: string }> {
  console.log('\n🔓 ═══════════════════════════════════════════════════════');
  console.log('🔓 [ADMIN-AUTH] VERIFY_CODE - Iniciando');
  console.log(`🔓 [ADMIN-AUTH] User Phone: ${userPhone}`);
  console.log(`🔓 [ADMIN-AUTH] Código informado: ${code}`);
  console.log('🔓 ═══════════════════════════════════════════════════════\n');
  
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    console.log(`🔓 [ADMIN-AUTH] Buscando sessões desde: ${fiveMinutesAgo}`);
    
    // Find pending session with this code
    const { data: sessions, error } = await supabase
      .from('sofia_admin_sessions')
      .select('*')
      .eq('user_phone', userPhone)
      .eq('verification_code', code)
      .eq('session_active', false)
      .gte('code_sent_at', fiveMinutesAgo)
      .order('code_sent_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('🔓 [ADMIN-AUTH] ❌ Erro na query:', error);
    }
    
    console.log(`🔓 [ADMIN-AUTH] Sessões encontradas: ${sessions?.length || 0}`);
    
    if (!sessions || sessions.length === 0) {
      console.log('🔓 [ADMIN-AUTH] ❌ Código inválido ou expirado');
      return { success: false, message: 'Código inválido ou expirado. Solicite um novo código.' };
    }
    
    const session = sessions[0];
    console.log(`🔓 [ADMIN-AUTH] ✅ Sessão encontrada: ${session.id}`);
    
    // Activate session
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MINUTES * 60 * 1000);
    
    const { error: updateError } = await supabase
      .from('sofia_admin_sessions')
      .update({
        session_active: true,
        code_verified_at: new Date().toISOString(),
        session_expires_at: expiresAt.toISOString()
      })
      .eq('id', session.id);
    
    if (updateError) {
      console.error('🔓 [ADMIN-AUTH] ❌ Erro ao ativar sessão:', updateError);
      return { success: false, message: 'Erro ao ativar sessão.' };
    }
    
    console.log(`🔓 [ADMIN-AUTH] ✅ Sessão ativada! Expira em: ${expiresAt.toISOString()}`);
    
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
    
    console.log('🔓 ═══════════════════════════════════════════════════════');
    console.log('🔓 [ADMIN-AUTH] VERIFY_CODE - SUCESSO');
    console.log('🔓 ═══════════════════════════════════════════════════════\n');
    
    return { 
      success: true, 
      message: `Modo Gerente Master ativado! Você tem ${SESSION_DURATION_MINUTES} minutos de acesso total. O que deseja consultar?`,
      session_id: session.id
    };
    
  } catch (error) {
    console.error('🔓 [ADMIN-AUTH] ❌ Erro fatal:', error);
    return { success: false, message: 'Erro ao verificar código.' };
  }
}

async function checkSession(userPhone: string): Promise<{ session_active: boolean; expires_in_minutes?: number; session_id?: string }> {
  console.log('\n🔍 ═══════════════════════════════════════════════════════');
  console.log('🔍 [ADMIN-AUTH] CHECK_SESSION - Iniciando');
  console.log(`🔍 [ADMIN-AUTH] User Phone: ${userPhone}`);
  console.log('🔍 ═══════════════════════════════════════════════════════\n');
  
  try {
    const now = new Date().toISOString();
    
    const { data: sessions, error } = await supabase
      .from('sofia_admin_sessions')
      .select('*')
      .eq('user_phone', userPhone)
      .eq('session_active', true)
      .gte('session_expires_at', now)
      .order('session_expires_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('🔍 [ADMIN-AUTH] ❌ Erro na query:', error);
    }
    
    console.log(`🔍 [ADMIN-AUTH] Sessões ativas encontradas: ${sessions?.length || 0}`);
    
    if (!sessions || sessions.length === 0) {
      console.log('🔍 [ADMIN-AUTH] ℹ️ Nenhuma sessão ativa');
      return { session_active: false };
    }
    
    const session = sessions[0];
    const expiresAt = new Date(session.session_expires_at);
    const minutesRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);
    
    console.log(`🔍 [ADMIN-AUTH] ✅ Sessão ativa encontrada!`);
    console.log(`🔍 [ADMIN-AUTH] - Session ID: ${session.id}`);
    console.log(`🔍 [ADMIN-AUTH] - Expira em: ${minutesRemaining} minutos`);
    
    return { 
      session_active: true, 
      expires_in_minutes: minutesRemaining,
      session_id: session.id
    };
    
  } catch (error) {
    console.error('🔍 [ADMIN-AUTH] ❌ Erro fatal:', error);
    return { session_active: false };
  }
}

async function endSession(userPhone: string): Promise<{ success: boolean; message: string }> {
  console.log('\n🚪 ═══════════════════════════════════════════════════════');
  console.log('🚪 [ADMIN-AUTH] END_SESSION - Iniciando');
  console.log(`🚪 [ADMIN-AUTH] User Phone: ${userPhone}`);
  console.log('🚪 ═══════════════════════════════════════════════════════\n');
  
  try {
    const { error } = await supabase
      .from('sofia_admin_sessions')
      .update({ session_active: false })
      .eq('user_phone', userPhone)
      .eq('session_active', true);
    
    if (error) {
      console.error('🚪 [ADMIN-AUTH] ❌ Erro ao encerrar:', error);
    }
    
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
    
    console.log('🚪 [ADMIN-AUTH] ✅ Sessão encerrada com sucesso');
    
    return { success: true, message: 'Sessão administrativa encerrada. Até a próxima!' };
    
  } catch (error) {
    console.error('🚪 [ADMIN-AUTH] ❌ Erro fatal:', error);
    return { success: false, message: 'Erro ao encerrar sessão.' };
  }
}

// Extend session when activity is detected in Gerente Master mode
async function extendSession(userPhone: string): Promise<{ success: boolean; message: string; extended_until?: string; expires_in_minutes?: number }> {
  console.log('\n🔄 ═══════════════════════════════════════════════════════');
  console.log('🔄 [ADMIN-AUTH] EXTEND_SESSION - Iniciando');
  console.log(`🔄 [ADMIN-AUTH] User Phone: ${userPhone}`);
  console.log('🔄 ═══════════════════════════════════════════════════════\n');
  
  try {
    const now = new Date().toISOString();
    
    // Find active session
    const { data: sessions, error } = await supabase
      .from('sofia_admin_sessions')
      .select('*')
      .eq('user_phone', userPhone)
      .eq('session_active', true)
      .gte('session_expires_at', now)
      .order('session_expires_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('🔄 [ADMIN-AUTH] ❌ Erro na query:', error);
      return { success: false, message: 'Erro ao verificar sessão.' };
    }
    
    if (!sessions || sessions.length === 0) {
      console.log('🔄 [ADMIN-AUTH] ℹ️ Nenhuma sessão ativa para estender');
      return { success: false, message: 'Nenhuma sessão ativa encontrada.' };
    }
    
    const session = sessions[0];
    const currentExpiry = new Date(session.session_expires_at);
    
    // Extend by SESSION_EXTENSION_MINUTES from now
    const newExpiry = new Date(Date.now() + SESSION_EXTENSION_MINUTES * 60 * 1000);
    
    // Only extend if new expiry is later than current
    const finalExpiry = newExpiry > currentExpiry ? newExpiry : currentExpiry;
    
    // Update session expiry
    const { error: updateError } = await supabase
      .from('sofia_admin_sessions')
      .update({
        session_expires_at: finalExpiry.toISOString()
      })
      .eq('id', session.id);
    
    if (updateError) {
      console.error('🔄 [ADMIN-AUTH] ❌ Erro ao estender sessão:', updateError);
      return { success: false, message: 'Erro ao estender sessão.' };
    }
    
    const minutesRemaining = Math.ceil((finalExpiry.getTime() - Date.now()) / 60000);
    
    console.log(`🔄 [ADMIN-AUTH] ✅ Sessão estendida!`);
    console.log(`🔄 [ADMIN-AUTH] - Nova expiração: ${finalExpiry.toISOString()}`);
    console.log(`🔄 [ADMIN-AUTH] - Minutos restantes: ${minutesRemaining}`);
    
    // Log extension
    await supabase.from('agent_logs').insert({
      agent_key: 'sofia',
      event_type: 'admin_session_extended',
      metadata: {
        session_id: session.id,
        user_phone: userPhone,
        old_expiry: currentExpiry.toISOString(),
        new_expiry: finalExpiry.toISOString(),
        extended_by_minutes: SESSION_EXTENSION_MINUTES,
        timestamp: new Date().toISOString()
      }
    });
    
    return { 
      success: true, 
      message: `Sessão estendida por mais ${SESSION_EXTENSION_MINUTES} minutos.`,
      extended_until: finalExpiry.toISOString(),
      expires_in_minutes: minutesRemaining
    };
    
  } catch (error) {
    console.error('🔄 [ADMIN-AUTH] ❌ Erro fatal:', error);
    return { success: false, message: 'Erro ao estender sessão.' };
  }
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const timestamp = new Date().toISOString();
  
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`🔐 [SOFIA-ADMIN-AUTH] REQUEST ${requestId}`);
  console.log(`🔐 [SOFIA-ADMIN-AUTH] Method: ${req.method}`);
  console.log(`🔐 [SOFIA-ADMIN-AUTH] Time: ${timestamp}`);
  console.log('════════════════════════════════════════════════════════════════\n');
  
  if (req.method === 'OPTIONS') {
    console.log(`🔐 [${requestId}] CORS preflight handled`);
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method === 'GET') {
    console.log(`🔐 [${requestId}] Health check request`);
    
    // Extended health check
    let zapiStatus = 'unknown';
    let directorInfo = null;
    
    try {
      const { data: agent } = await supabase
        .from('agents')
        .select('zapi_config')
        .eq('key', 'exa_alert')
        .single();
      
      zapiStatus = agent?.zapi_config ? 'configured' : 'not_configured';
    } catch (e) {
      zapiStatus = 'error_checking';
    }
    
    try {
      const { data: directors } = await supabase
        .from('exa_alerts_directors')
        .select('nome, telefone')
        .eq('ativo', true)
        .limit(1);
      
      directorInfo = directors?.[0] || null;
    } catch (e) {
      console.error('Erro ao buscar diretor:', e);
    }
    
    const healthData = {
      status: 'ok',
      service: 'Sofia Admin Auth',
      version: '3.0',
      request_id: requestId,
      timestamp,
      diagnostics: {
        zapi_status: zapiStatus,
        has_zapi_client_token: !!Deno.env.get('ZAPI_CLIENT_TOKEN'),
        active_director: directorInfo?.nome || 'none',
        director_phone_configured: !!directorInfo?.telefone,
        supabase_url: supabaseUrl ? 'configured' : 'missing'
      }
    };
    
    console.log('🔐 Health check response:', JSON.stringify(healthData, null, 2));
    
    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const bodyText = await req.text();
    console.log(`🔐 [${requestId}] Raw body:`, bodyText);
    
    const body = JSON.parse(bodyText);
    const { action, user_phone, user_name, code } = body;

    // ElevenLabs pode não fornecer user_phone; usamos identificador estável
    const effectiveUserPhone = (typeof user_phone === 'string' && user_phone.trim())
      ? user_phone.trim()
      : (typeof user_name === 'string' && user_name.trim())
        ? `voice_${user_name.trim()}`
        : 'voice_session';

    console.log(`🔐 [${requestId}] Action: ${action}`);
    console.log(`🔐 [${requestId}] Effective Phone: ${effectiveUserPhone}`);
    console.log(`🔐 [${requestId}] User Name: ${user_name || 'não informado'}`);
    if (code) console.log(`🔐 [${requestId}] Code: ${code}`);

    let result: any;

    switch (action) {
      case 'request_code':
        // Verificar se 2FA está ativado
        const is2FA = await is2FAEnabled();
        if (!is2FA) {
          // 2FA desativado: ativar sessão diretamente
          result = await activateSessionDirectly(effectiveUserPhone, user_name);
        } else {
          // 2FA ativado: enviar código normalmente
          result = await requestVerificationCode(effectiveUserPhone, user_name);
        }
        break;

      case 'verify_code':
        if (!code) {
          result = { success: false, message: 'Código não informado. Diga o código de 6 dígitos.' };
        } else {
          result = await verifyCode(effectiveUserPhone, code);
        }
        break;

      case 'check_session':
        result = await checkSession(effectiveUserPhone);
        break;

      case 'end_session':
        result = await endSession(effectiveUserPhone);
        break;

      case 'extend_session':
        result = await extendSession(effectiveUserPhone);
        break;

      default:
        console.log(`🔐 [${requestId}] ⚠️ Ação desconhecida: ${action}`);
        result = { success: false, message: `Ação desconhecida: ${action}. Use: check_session, request_code, verify_code, extend_session ou end_session.` };
    }
    
    console.log(`🔐 [${requestId}] Response:`, JSON.stringify(result, null, 2));
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error(`🔐 [${requestId}] ❌ ERRO FATAL:`, error);
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
