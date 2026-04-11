import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  const timestamp = new Date().toISOString();
  
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`🎤 [ELEVENLABS-TOKEN] REQUEST ${requestId}`);
  console.log(`🎤 [ELEVENLABS-TOKEN] Time: ${timestamp}`);
  console.log('════════════════════════════════════════════════════════════════\n');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`🎤 [${requestId}] CORS preflight handled`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const ELEVENLABS_AGENT_ID = Deno.env.get('ELEVENLABS_AGENT_ID');

    console.log(`🎤 [${requestId}] Checking configuration...`);
    console.log(`🎤 [${requestId}] - ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY ? 'configured ✅' : 'MISSING ❌'}`);
    console.log(`🎤 [${requestId}] - ELEVENLABS_AGENT_ID: ${ELEVENLABS_AGENT_ID ? `${ELEVENLABS_AGENT_ID} ✅` : 'MISSING ❌'}`);

    if (!ELEVENLABS_API_KEY) {
      console.error(`🎤 [${requestId}] ❌ ELEVENLABS_API_KEY not configured`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ELEVENLABS_API_KEY not configured',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (!ELEVENLABS_AGENT_ID) {
      console.error(`🎤 [${requestId}] ❌ ELEVENLABS_AGENT_ID not configured`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ELEVENLABS_AGENT_ID not configured',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Fetch agent info to verify configuration
    console.log(`🎤 [${requestId}] Fetching agent info...`);
    const agentInfoResp = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (agentInfoResp.ok) {
      const agentInfo = await agentInfoResp.json();
      const tools = agentInfo?.conversation_config?.agent?.prompt?.tools || [];
      const toolNames = tools.map((t: any) => t.name || t.tool_config?.name).filter(Boolean);
      
      console.log(`🎤 [${requestId}] Agent name: ${agentInfo?.name || 'unknown'}`);
      console.log(`🎤 [${requestId}] Agent language: ${agentInfo?.conversation_config?.agent?.language || 'unknown'}`);
      console.log(`🎤 [${requestId}] Tools configured: ${toolNames.length > 0 ? toolNames.join(', ') : 'none'}`);
      
      const hasAdminAuth = toolNames.includes('admin_auth');
      const hasConsultarSistema = toolNames.includes('consultar_sistema');
      
      console.log(`🎤 [${requestId}] - admin_auth: ${hasAdminAuth ? '✅' : '❌ MISSING'}`);
      console.log(`🎤 [${requestId}] - consultar_sistema: ${hasConsultarSistema ? '✅' : '❌ MISSING'}`);
      
      if (!hasAdminAuth || !hasConsultarSistema) {
        console.warn(`🎤 [${requestId}] ⚠️ Agent missing required tools! Configure them in ElevenLabs console.`);
      }
    } else {
      console.warn(`🎤 [${requestId}] ⚠️ Could not fetch agent info: ${agentInfoResp.status}`);
    }

    // Request conversation token
    console.log(`🎤 [${requestId}] Requesting conversation token...`);
    
    const tokenUrl = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`;
    console.log(`🎤 [${requestId}] Token URL: ${tokenUrl}`);

    const response = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🎤 [${requestId}] ❌ ElevenLabs API error:`, response.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `ElevenLabs API error: ${response.status}`,
          details: errorText,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        }
      );
    }

    const data = await response.json();
    
    console.log(`🎤 [${requestId}] ✅ Token obtained successfully!`);
    console.log(`🎤 [${requestId}] Token preview: ${data.token?.substring(0, 20)}...`);

    return new Response(
      JSON.stringify({
        success: true,
        token: data.token,
        agent_id: ELEVENLABS_AGENT_ID,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`🎤 [${requestId}] ❌ FATAL ERROR:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
