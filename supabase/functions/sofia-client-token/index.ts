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
    // Use dedicated client agent ID - DO NOT fallback to admin agent!
    const AGENT_ID = Deno.env.get('ELEVENLABS_CLIENT_AGENT_ID');

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
      console.error(`[${requestId}] ❌ ELEVENLABS_CLIENT_AGENT_ID not configured`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Sofia Cliente não configurada. Configure ELEVENLABS_CLIENT_AGENT_ID.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Get user context from auth header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    let userEmail = null;
    let userName = null;

    // Get page context from request body
    const body = await req.json().catch(() => ({}));
    const pageContext = body.pageContext || {};

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

        // Fetch user name from users table
        const serviceSupabase = createClient(
          Deno.env.get('SUPABASE_URL') || '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        );
        
        const { data: userData } = await serviceSupabase
          .from('users')
          .select('nome')
          .eq('id', userId)
          .single();
        
        userName = userData?.nome || user.email?.split('@')[0];
        
        console.log(`[${requestId}] User context: ${userName} (${userEmail})`);
        console.log(`[${requestId}] Page context:`, pageContext);
      }
    }

    console.log(`[${requestId}] Requesting token for Sofia Client agent: ${AGENT_ID}`);

    // Request conversation token using GET (the only supported method)
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

    console.log(`[${requestId}] ✅ Token obtained successfully for Sofia Client`);

    return new Response(JSON.stringify({
      success: true,
      token: data.token,
      agent_id: AGENT_ID,
      user_context: {
        user_id: userId,
        email: userEmail,
        name: userName,
        page: pageContext.currentPage,
        section: pageContext.section,
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
