import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`\n[SOFIA-CLIENT-TOKEN] ${requestId} - Request received`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    // Use dedicated client agent ID, fallback to main agent if not set
    const AGENT_ID = Deno.env.get('ELEVENLABS_CLIENT_AGENT_ID') || Deno.env.get('ELEVENLABS_AGENT_ID');

    if (!ELEVENLABS_API_KEY) {
      console.error(`[${requestId}] ❌ ELEVENLABS_API_KEY not configured`);
      return new Response(JSON.stringify({
        success: false,
        error: 'ELEVENLABS_API_KEY not configured',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!AGENT_ID) {
      console.error(`[${requestId}] ❌ No agent ID configured`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Agent ID not configured. Run configure-sofia-client-agent first.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Get user context from auth header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    let userEmail = null;

    if (authHeader) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_ANON_KEY') || '',
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email;
        console.log(`[${requestId}] User context: ${userEmail}`);
      }
    }

    console.log(`[${requestId}] Requesting token for agent: ${AGENT_ID}`);

    // Request conversation token
    const tokenUrl = `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${AGENT_ID}`;
    
    const response = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${requestId}] ❌ ElevenLabs API error:`, response.status, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `ElevenLabs API error: ${response.status}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    const data = await response.json();

    console.log(`[${requestId}] ✅ Token obtained successfully`);

    return new Response(JSON.stringify({
      success: true,
      token: data.token,
      agent_id: AGENT_ID,
      user_context: {
        user_id: userId,
        email: userEmail,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${requestId}] ❌ Error:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
