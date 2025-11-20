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

    // Verificar agente Eduardo
    const { data: eduardo } = await supabase
      .from('agents')
      .select('*')
      .eq('key', 'eduardo')
      .single();

    const whatsappKey = Deno.env.get('WHATSAPP_API_KEY');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const credentialsPresent = !!(whatsappKey && phoneNumberId);

    if (!credentialsPresent) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'WhatsApp credentials not configured',
          credentialsPresent: false,
          number: eduardo?.whatsapp_number || null,
          requiredVariables: [
            'WHATSAPP_API_KEY',
            'WHATSAPP_PHONE_NUMBER_ID',
            'WHATSAPP_API_URL'
          ],
          instructions: 'Add these variables in Supabase Dashboard → Settings → Edge Functions → Secrets'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'WhatsApp credentials configured',
        credentialsPresent: true,
        number: eduardo?.whatsapp_number || null,
        active: true,
        lastCheck: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[WHATSAPP-TEST] Error:', error);
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
