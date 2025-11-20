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

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[MANYCHAT-TEST] Testing ManyChat integration...');

    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    const credentialsPresent = !!manychatApiKey;

    if (!credentialsPresent) {
      const responseTime = Date.now() - startTime;
      
      // Log no banco
      await supabase.from('api_logs').insert({
        api_name: 'ManyChat API',
        endpoint: 'credentials_check',
        status_code: 400,
        response_time_ms: responseTime,
        success: false,
        error_message: 'ManyChat API key not configured'
      });

      return new Response(
        JSON.stringify({
          success: false,
          connected: false,
          message: 'ManyChat credentials not configured',
          credentialsPresent: false,
          requiredVariables: ['MANYCHAT_API_KEY', 'MANYCHAT_SYNC_SECRET'],
          instructions: 'Add these variables in Supabase Dashboard → Settings → Edge Functions → Secrets'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Testar conexão REAL com a API do ManyChat
    console.log('[MANYCHAT-TEST] Testing real API connection...');
    
    const manychatResponse = await fetch('https://api.manychat.com/fb/page/getInfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${manychatApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;
    const manychatData = await manychatResponse.json();
    const connected = manychatResponse.ok && manychatData.status === 'success';

    // Log no banco
    await supabase.from('api_logs').insert({
      api_name: 'ManyChat API',
      endpoint: 'https://api.manychat.com/fb/page/getInfo',
      status_code: manychatResponse.status,
      response_time_ms: responseTime,
      success: connected,
      error_message: connected ? null : manychatData.message || 'Failed to connect',
      response_data: manychatData
    });

    if (!connected) {
      return new Response(
        JSON.stringify({
          success: false,
          connected: false,
          credentialsPresent: true,
          message: manychatData.message || 'Failed to connect to ManyChat API',
          error: manychatData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Buscar configuração dos agentes
    const { data: agents } = await supabase
      .from('agents')
      .select('key, display_name, whatsapp_number, manychat_connected')
      .eq('manychat_connected', true);

    return new Response(
      JSON.stringify({
        success: true,
        connected: true,
        credentialsPresent: true,
        message: 'ManyChat API connected successfully',
        pageInfo: {
          id: manychatData.data?.id,
          name: manychatData.data?.name,
          timezone: manychatData.data?.timezone
        },
        connectedAgents: agents || [],
        responseTime,
        lastCheck: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[MANYCHAT-TEST] Error:', error);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('api_logs').insert({
      api_name: 'ManyChat API',
      endpoint: 'test_connection',
      status_code: 500,
      response_time_ms: responseTime,
      success: false,
      error_message: error.message
    });

    return new Response(
      JSON.stringify({ 
        success: false,
        connected: false,
        credentialsPresent: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});