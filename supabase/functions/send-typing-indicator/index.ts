import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, agentKey, action } = await req.json(); // action: 'start' ou 'stop'

    console.log('[TYPING-INDICATOR] ⌨️', { phone, agentKey, action });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar configuração Z-API do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', agentKey)
      .single();

    if (agentError || !agent?.zapi_config) {
      throw new Error('Agent Z-API config not found');
    }

    const { instance_id, token } = agent.zapi_config;
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!instance_id || !token) {
      throw new Error('Invalid Z-API configuration');
    }

    // Chamar Z-API para enviar indicador de digitação
    const response = await fetch(
      `https://api.z-api.io/instances/${instance_id}/token/${token}/typing`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': zapiClientToken || ''
        },
        body: JSON.stringify({
          phone,
          action: action === 'start' ? 'typing' : 'stop'
        })
      }
    );

    const result = await response.json();

    console.log('[TYPING-INDICATOR] ✅ Result:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TYPING-INDICATOR] ❌', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
