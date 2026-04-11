import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { agentKey, action } = await req.json();

    console.log('[CONFIGURE-ZAPI] 🔧 Request:', {
      agentKey,
      action,
      timestamp: new Date().toISOString()
    });

    if (!agentKey) {
      throw new Error('Missing required field: agentKey');
    }

    // Buscar configuração do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    const zapiConfig = agent.zapi_config as any;
    if (!zapiConfig?.instance_id || !zapiConfig?.token) {
      throw new Error('Z-API not configured for this agent');
    }

    const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN');
    if (!ZAPI_CLIENT_TOKEN) {
      throw new Error('ZAPI_CLIENT_TOKEN not configured');
    }

    const instanceId = zapiConfig.instance_id;
    const token = zapiConfig.token;
    const baseUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}`;

    // ========== DIAGNÓSTICO: VERIFICAR CONFIGURAÇÕES ATUAIS ==========
    if (action === 'diagnose') {
      console.log('[CONFIGURE-ZAPI] 🔍 Running diagnostics...');

      // 1. Verificar status da instância
      const statusResponse = await fetch(`${baseUrl}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': ZAPI_CLIENT_TOKEN
        }
      });

      const statusData = await statusResponse.json();
      console.log('[CONFIGURE-ZAPI] 📊 Instance status:', statusData);

      // 2. Verificar configuração do webhook
      const webhookResponse = await fetch(`${baseUrl}/webhook`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': ZAPI_CLIENT_TOKEN
        }
      });

      const webhookData = await webhookResponse.json();
      console.log('[CONFIGURE-ZAPI] 📡 Webhook config:', webhookData);

      // 3. Analisar configurações
      const diagnosis = {
        instanceStatus: statusData,
        webhookConfig: webhookData,
        issues: [] as string[],
        recommendations: [] as string[]
      };

      // Verificar se webhook está configurado
      if (!webhookData.value || !webhookData.enabled) {
        diagnosis.issues.push('Webhook não está configurado ou não está habilitado');
        diagnosis.recommendations.push('Configure o webhook primeiro');
      }

      // Verificar se está recebendo mensagens próprias
      const receivesOwnMessages = webhookData.receiveSentMessages === true ||
                                   webhookData.receivingOwnMessages === true ||
                                   webhookData.includeOwnMessages === true;

      if (!receivesOwnMessages) {
        diagnosis.issues.push('Webhook NÃO está configurado para receber mensagens fromMe=true');
        diagnosis.recommendations.push('Execute a ação "configure" para habilitar recebimento de mensagens enviadas');
      } else {
        diagnosis.recommendations.push('✅ Webhook já está configurado para receber mensagens próprias');
      }

      // Verificar conexão WhatsApp
      if (!statusData.connected) {
        diagnosis.issues.push('WhatsApp não está conectado');
        diagnosis.recommendations.push('Escaneie o QR Code para conectar');
      }

      console.log('[CONFIGURE-ZAPI] ✅ Diagnosis complete:', diagnosis);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'diagnose',
          agent: agentKey,
          diagnosis
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== CONFIGURAR: HABILITAR RECEBIMENTO DE MENSAGENS fromMe=true ==========
    if (action === 'configure') {
      console.log('[CONFIGURE-ZAPI] ⚙️ Configuring webhook to receive fromMe messages...');

      // URL do webhook atual (usar a mesma URL já configurada ou a padrão)
      const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/zapi-webhook`;

      // Configurar webhook para receber mensagens fromMe=true
      const configPayload = {
        value: webhookUrl,
        enabled: true,
        webhookByToken: ZAPI_CLIENT_TOKEN,
        // PARÂMETROS CRÍTICOS para receber mensagens enviadas pelo agente
        receiveSentMessages: true,        // Z-API usa este parâmetro
        ignoreSelfMessages: false,        // Não ignorar mensagens próprias
        receiveOwnMessages: true,         // Alternativa em algumas versões
        includeOwnMessages: true          // Alternativa em algumas versões
      };

      console.log('[CONFIGURE-ZAPI] 📤 Sending configuration:', configPayload);

      const configResponse = await fetch(`${baseUrl}/webhook`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': ZAPI_CLIENT_TOKEN
        },
        body: JSON.stringify(configPayload)
      });

      const configResult = await configResponse.json();

      if (!configResponse.ok) {
        console.error('[CONFIGURE-ZAPI] ❌ Configuration failed:', configResult);
        throw new Error(configResult.error || 'Failed to configure webhook');
      }

      console.log('[CONFIGURE-ZAPI] ✅ Webhook configured successfully:', configResult);

      // Verificar se a configuração foi aplicada
      const verifyResponse = await fetch(`${baseUrl}/webhook`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': ZAPI_CLIENT_TOKEN
        }
      });

      const verifiedConfig = await verifyResponse.json();
      console.log('[CONFIGURE-ZAPI] 🔍 Verified configuration:', verifiedConfig);

      // Log no banco
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        event_type: 'webhook_configured',
        metadata: {
          action: 'configure_fromme_messages',
          config_sent: configPayload,
          config_result: configResult,
          verified_config: verifiedConfig,
          timestamp: new Date().toISOString()
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: 'configure',
          agent: agentKey,
          configResult,
          verifiedConfig,
          message: 'Webhook configurado para receber mensagens fromMe=true'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== TESTAR: ENVIAR MENSAGEM DE TESTE ==========
    if (action === 'test') {
      console.log('[CONFIGURE-ZAPI] 🧪 Testing configuration...');

      const { testPhone } = await req.json();
      if (!testPhone) {
        throw new Error('Missing testPhone for test action');
      }

      // Enviar mensagem de teste
      const testMessage = {
        phone: testPhone,
        message: `🧪 Teste de configuração - ${new Date().toLocaleTimeString('pt-BR')}\n\nSe você está vendo esta mensagem no CRM, a configuração está funcionando!`
      };

      const testResponse = await fetch(`${baseUrl}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': ZAPI_CLIENT_TOKEN
        },
        body: JSON.stringify(testMessage)
      });

      const testResult = await testResponse.json();
      console.log('[CONFIGURE-ZAPI] 📨 Test message sent:', testResult);

      return new Response(
        JSON.stringify({
          success: true,
          action: 'test',
          agent: agentKey,
          testResult,
          message: 'Mensagem de teste enviada. Aguarde alguns segundos e verifique se aparece no CRM.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Invalid action: ${action}. Use "diagnose", "configure", or "test"`);

  } catch (error) {
    console.error('[CONFIGURE-ZAPI] 💥 Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
