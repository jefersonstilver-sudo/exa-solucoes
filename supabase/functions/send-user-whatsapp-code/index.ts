import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  userId: string;
  telefone: string;
  tipo: 'phone_change' | '2fa_login' | 'new_phone' | 'signup';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: RequestBody = await req.json();
    const { userId, telefone, tipo } = body;

    console.log('📱 [SEND-USER-CODE] Requisição recebida:', { userId, telefone: telefone?.substring(0, 8) + '****', tipo });

    if (!userId || !telefone || !tipo) {
      console.error('❌ [SEND-USER-CODE] Parâmetros faltando');
      return new Response(
        JSON.stringify({ error: 'userId, telefone e tipo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configuração Z-API do banco de dados
    console.log('🔍 [SEND-USER-CODE] Buscando configuração Z-API do agente exa_alert...');
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'exa_alert')
      .single();

    if (agentError || !agentData) {
      console.error('❌ [SEND-USER-CODE] Erro ao buscar configuração do agente:', agentError);
      return new Response(
        JSON.stringify({ error: 'Configuração Z-API não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const zapiConfig = agentData.zapi_config as any;
    const instanceId = zapiConfig?.instance_id;
    const instanceToken = zapiConfig?.token;
    const clientToken = zapiConfig?.client_token;

    if (!instanceId || !instanceToken || !clientToken) {
      console.error('❌ [SEND-USER-CODE] Configuração Z-API incompleta:', { instanceId: !!instanceId, instanceToken: !!instanceToken, clientToken: !!clientToken });
      return new Response(
        JSON.stringify({ error: 'Configuração Z-API incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [SEND-USER-CODE] Configuração Z-API carregada com sucesso');

    // Rate limiting: verificar tentativas recentes (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentAttempts } = await supabase
      .from('exa_alerts_verification_codes')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo_verificacao', tipo)
      .gte('created_at', fiveMinutesAgo);

    if (recentAttempts && recentAttempts.length >= 3) {
      console.warn('⚠️ [SEND-USER-CODE] Rate limit excedido:', userId);
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔐 [SEND-USER-CODE] Código gerado:', codigo.substring(0, 3) + '***');

    // Definir mensagem baseada no tipo
    let mensagem = '';
    switch (tipo) {
      case 'phone_change':
        mensagem = `🔐 *Código de Verificação EXA*\n\nSeu código para alterar o WhatsApp é:\n\n*${codigo}*\n\nVálido por 5 minutos.`;
        break;
      case '2fa_login':
        mensagem = `🔐 *Código de Acesso EXA*\n\nSeu código de autenticação é:\n\n*${codigo}*\n\nVálido por 5 minutos.\n\n_Se você não tentou fazer login, ignore esta mensagem._`;
        break;
      case 'new_phone':
        mensagem = `✅ *Verificação de Novo WhatsApp - EXA*\n\nSeu código de verificação é:\n\n*${codigo}*\n\nVálido por 5 minutos.`;
        break;
      case 'signup':
        mensagem = `🎉 *Bem-vindo à EXA!*\n\nPara completar seu cadastro, digite o código:\n\n*${codigo}*\n\nVálido por 5 minutos.`;
        break;
      default:
        mensagem = `🔐 Código de verificação EXA: *${codigo}*\n\nVálido por 5 minutos.`;
    }

    // Salvar código no banco (expira em 5 minutos)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase
      .from('exa_alerts_verification_codes')
      .insert({
        user_id: userId,
        telefone: telefone,
        codigo: codigo,
        expires_at: expiresAt,
        verificado: false,
        tipo_verificacao: tipo,
      });

    if (insertError) {
      console.error('❌ [SEND-USER-CODE] Erro ao salvar código:', insertError);
      throw insertError;
    }

    // Enviar via Z-API
    const phoneFormatted = telefone.replace(/\D/g, '');
    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;

    console.log('📤 [SEND-USER-CODE] Enviando código via Z-API para:', phoneFormatted.substring(0, 8) + '****');

    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Client-Token': clientToken
      },
      body: JSON.stringify({
        phone: phoneFormatted,
        message: mensagem,
      }),
    });

    if (!zapiResponse.ok) {
      const errorText = await zapiResponse.text();
      console.error('❌ [SEND-USER-CODE] Erro ao enviar via Z-API:', errorText);
      throw new Error(`Erro ao enviar código via WhatsApp: ${errorText}`);
    }

    console.log('✅ [SEND-USER-CODE] Código enviado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código enviado com sucesso',
        expiresAt 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [SEND-USER-CODE] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao enviar código' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
