import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const ELEVENLABS_AGENT_ID = Deno.env.get('ELEVENLABS_AGENT_ID');

    if (!ELEVENLABS_API_KEY) {
      console.error('[elevenlabs-conversation-token] ELEVENLABS_API_KEY not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ELEVENLABS_API_KEY not configured',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    if (!ELEVENLABS_AGENT_ID) {
      console.error('[elevenlabs-conversation-token] ELEVENLABS_AGENT_ID not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ELEVENLABS_AGENT_ID not configured',
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log('[elevenlabs-conversation-token] Requesting token for agent:', ELEVENLABS_AGENT_ID);

    // Request a conversation token from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[elevenlabs-conversation-token] ElevenLabs API error:', response.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `ElevenLabs API error: ${response.status}`,
          details: errorText,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status
        }
      );
    }

    const data = await response.json();
    console.log('[elevenlabs-conversation-token] Token obtained successfully');

    return new Response(
      JSON.stringify({
        success: true,
        token: data.token,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[elevenlabs-conversation-token] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
