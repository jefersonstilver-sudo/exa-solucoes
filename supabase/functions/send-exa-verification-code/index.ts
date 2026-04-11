import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { telefone, directorId } = await req.json();

    if (!telefone) {
      throw new Error('Telefone é obrigatório');
    }

    console.log('Generating verification code for:', telefone);

    // ============= RATE LIMITING =============
    const now = new Date();
    
    // Check attempts in last 5 minutes
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const { count: count5min } = await supabase
      .from('exa_alerts_verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('telefone', telefone)
      .gte('created_at', fiveMinutesAgo.toISOString());

    if (count5min && count5min >= 3) {
      console.warn(`Rate limit hit: ${count5min} attempts in 5 minutes for ${telefone}`);
      throw new Error('Muitas tentativas. Você foi bloqueado por 5 minutos.');
    }

    // Check attempts in last 15 minutes
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const { count: count15min } = await supabase
      .from('exa_alerts_verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('telefone', telefone)
      .gte('created_at', fifteenMinutesAgo.toISOString());

    if (count15min && count15min >= 5) {
      console.warn(`Rate limit hit: ${count15min} attempts in 15 minutes for ${telefone}`);
      throw new Error('Muitas tentativas. Você foi bloqueado por 15 minutos.');
    }

    // Check attempts in last hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const { count: count1hour } = await supabase
      .from('exa_alerts_verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('telefone', telefone)
      .gte('created_at', oneHourAgo.toISOString());

    if (count1hour && count1hour >= 10) {
      console.warn(`Rate limit hit: ${count1hour} attempts in 1 hour for ${telefone}`);
      throw new Error('Muitas tentativas. Você foi bloqueado por 1 hora.');
    }

    console.log('Rate limit check passed. Attempts:', { count5min, count15min, count1hour });
    // ============= END RATE LIMITING =============

    // Generate 6-digit code
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Save code to database with 5-minute expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const { error: insertError } = await supabase
      .from('exa_alerts_verification_codes')
      .insert({
        director_id: directorId || null,
        telefone,
        codigo,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error saving verification code:', insertError);
      throw insertError;
    }

    console.log('Verification code saved, now sending via Z-API...');

    // Get Z-API config from agents table (assuming there's an EXA agent configured)
    const { data: agentData, error: agentError } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'exa_alert')
      .single();

    if (agentError || !agentData?.zapi_config) {
      console.error('Z-API configuration not found for EXA Alerts');
      throw new Error('Configuração Z-API não encontrada');
    }

    const zapiConfig = agentData.zapi_config as {
      instance_id?: string;
      token?: string;
      client_token?: string;
    };

    const instanceId = zapiConfig.instance_id;
    const instanceToken = zapiConfig.token;
    const clientToken = zapiConfig.client_token;

    console.log('Z-API config loaded:', {
      instanceId,
      token: instanceToken,
      clientToken,
      fullConfig: zapiConfig
    });

    if (!instanceId || !instanceToken || !clientToken) {
      console.error('Missing Z-API credentials:', {
        hasInstanceId: !!instanceId,
        hasInstanceToken: !!instanceToken,
        hasClientToken: !!clientToken,
        config: zapiConfig
      });
      throw new Error('Z-API credentials missing');
    }

    // Format phone number (remove non-digits)
    const cleanPhone = telefone.replace(/\D/g, '');

    // Send WhatsApp message via Z-API
    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;
    console.log('🚀 Sending to Z-API:', { 
      url: zapiUrl, 
      phone: cleanPhone,
      instanceId,
      token: instanceToken?.substring(0, 10) + '...',
      clientToken: clientToken?.substring(0, 10) + '...'
    });

    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken,
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: `🔐 *Código de Verificação EXA Alerts*\n\nSeu código de verificação é:\n\n*${codigo}*\n\nEste código expira em 5 minutos.\n\n⚠️ Não compartilhe este código com ninguém.`,
      }),
    });

    console.log('Z-API response status:', zapiResponse.status);
    const responseText = await zapiResponse.text();
    console.log('Z-API response body:', responseText);

    if (!zapiResponse.ok) {
      console.error('Z-API error response:', {
        status: zapiResponse.status,
        body: responseText
      });
      throw new Error('Erro ao enviar mensagem via WhatsApp');
    }

    console.log('✅ Verification code sent successfully via WhatsApp');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código enviado com sucesso' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-exa-verification-code:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro ao enviar código de verificação' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
