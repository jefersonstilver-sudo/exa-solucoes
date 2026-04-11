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
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: 'RESEND_API_KEY não configurada',
          configured: false
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Testar conexão com Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Resend API error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ 
          connected: false, 
          configured: true,
          error: `API retornou status ${response.status}`,
          apiKeyMasked: `re_${RESEND_API_KEY.slice(-8)}`
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar informações do domínio
    const domainsResponse = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let verifiedDomain = null;
    if (domainsResponse.ok) {
      const domainsData = await domainsResponse.json();
      const verified = domainsData.data?.find((d: any) => d.status === 'verified');
      if (verified) {
        verifiedDomain = verified.name;
      }
    }

    return new Response(
      JSON.stringify({ 
        connected: true,
        configured: true,
        domain: verifiedDomain || 'Nenhum domínio verificado',
        apiKeyMasked: `re_${RESEND_API_KEY.slice(-8)}`,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error testing Resend connection:', error);
    return new Response(
      JSON.stringify({ 
        connected: false,
        configured: true,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
