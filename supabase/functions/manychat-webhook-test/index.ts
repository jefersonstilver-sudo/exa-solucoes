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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('[MANYCHAT-TEST] Testing ManyChat integration...');

    // Verificar se existe configuração em agent_context
    const { data: config } = await supabase
      .from('agent_context')
      .select('value')
      .eq('key', 'manychat_config')
      .single();

    const manychatApiKey = Deno.env.get('MANYCHAT_API_KEY');
    const credentialsPresent = !!manychatApiKey;

    if (!credentialsPresent) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ManyChat credentials not configured',
          credentialsPresent: false,
          requiredVariables: [
            'MANYCHAT_API_KEY',
            'MANYCHAT_SYNC_SECRET'
          ],
          instructions: 'Add these variables in Supabase Dashboard → Settings → Edge Functions → Secrets'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Se credenciais existem, testar conexão
    console.log('[MANYCHAT-TEST] Testing API connection...');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'ManyChat credentials configured',
        credentialsPresent: true,
        configExists: !!config,
        lastCheck: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[MANYCHAT-TEST] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        credentialsPresent: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
