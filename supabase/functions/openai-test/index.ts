import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'OpenAI API key not configured',
          credentialsPresent: false,
          requiredVariables: ['OPENAI_API_KEY'],
          instructions: 'Add OPENAI_API_KEY in Supabase Dashboard → Settings → Edge Functions → Secrets'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Testar conexão com OpenAI
    const startTime = Date.now();
    
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${openaiKey}`
      }
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OpenAI API connection successful',
        credentialsPresent: true,
        latency,
        modelsCount: data.data?.length || 0,
        lastCheck: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[OPENAI-TEST] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        credentialsPresent: true,
        message: 'OpenAI API connection failed'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});
