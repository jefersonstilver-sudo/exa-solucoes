import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[MONITOR-ZAPI] 🔍 Iniciando monitoramento de conexões Z-API...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN');
    
    if (!ZAPI_CLIENT_TOKEN) {
      throw new Error('ZAPI_CLIENT_TOKEN not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar todos os agentes com Z-API configurado
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('key, display_name, zapi_config')
      .eq('whatsapp_provider', 'zapi')
      .eq('is_active', true);

    if (agentsError) {
      console.error('[MONITOR-ZAPI] ❌ Erro ao buscar agentes:', agentsError);
      throw agentsError;
    }

    console.log(`[MONITOR-ZAPI] 📱 Verificando ${agents?.length || 0} agentes Z-API...`);

    const results = [];
    const disconnectedAgents = [];

    for (const agent of agents || []) {
      const zapiConfig = agent.zapi_config as any;
      const instanceId = zapiConfig?.instance_id;

      if (!instanceId) {
        console.log(`[MONITOR-ZAPI] ⚠️ ${agent.display_name} sem instance_id`);
        continue;
      }

      try {
        // Verificar status da instância
        const statusUrl = `https://api.z-api.io/instances/${instanceId}/token/${ZAPI_CLIENT_TOKEN}/status`;
        const statusResponse = await fetch(statusUrl);
        const statusData = await statusResponse.json();

        const isConnected = statusData.connected || false;
        const phone = statusData.phone || null;

        console.log(`[MONITOR-ZAPI] ${isConnected ? '✅' : '❌'} ${agent.display_name} (${phone || 'sem número'})`);

        results.push({
          agent_key: agent.key,
          display_name: agent.display_name,
          instance_id: instanceId,
          connected: isConnected,
          phone: phone,
        });

        // Se desconectado, adicionar à lista de alertas
        if (!isConnected) {
          disconnectedAgents.push({
            agent_key: agent.key,
            display_name: agent.display_name,
            instance_id: instanceId,
          });

          // Criar alerta no sistema
          await supabase.from('panel_alerts').insert({
            painel_id: '00000000-0000-0000-0000-000000000000', // ID placeholder para alertas Z-API
            alert_type: 'zapi_disconnected',
            severity: 'high',
            message: `Z-API desconectado: ${agent.display_name}`,
            details: {
              agent_key: agent.key,
              instance_id: instanceId,
              timestamp: new Date().toISOString(),
            },
            resolved: false,
          });
        }

        // Atualizar status no agente
        const newZapiConfig = {
          ...zapiConfig,
          status: isConnected ? 'connected' : 'disconnected',
          last_check: new Date().toISOString(),
          phone: phone,
        };

        await supabase
          .from('agents')
          .update({ zapi_config: newZapiConfig })
          .eq('key', agent.key);

      } catch (error) {
        console.error(`[MONITOR-ZAPI] ❌ Erro ao verificar ${agent.display_name}:`, error);
        results.push({
          agent_key: agent.key,
          display_name: agent.display_name,
          instance_id: instanceId,
          connected: false,
          error: error.message,
        });
      }
    }

    const summary = {
      total_agents: results.length,
      connected: results.filter(r => r.connected).length,
      disconnected: disconnectedAgents.length,
      timestamp: new Date().toISOString(),
    };

    console.log('[MONITOR-ZAPI] 📊 Resumo:', summary);

    if (disconnectedAgents.length > 0) {
      console.log('[MONITOR-ZAPI] ⚠️ Agentes desconectados:', disconnectedAgents);
    }

    return new Response(JSON.stringify({
      success: true,
      summary,
      results,
      disconnected_agents: disconnectedAgents,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[MONITOR-ZAPI] ❌ Erro:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
