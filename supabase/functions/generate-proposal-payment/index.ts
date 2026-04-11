/**
 * @deprecated Esta Edge Function foi descontinuada em 2026-01-10.
 * Mercado Pago foi removido do sistema EXA.
 * Use process-payment com ASAAS para gerar cobranças de propostas.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('⚠️ [DEPRECATED] generate-proposal-payment chamado - endpoint descontinuado');

  return new Response(JSON.stringify({
    error: 'Endpoint descontinuado',
    message: 'Mercado Pago foi removido do sistema EXA. Use process-payment com ASAAS.',
    status: 'deprecated',
    alternative: 'process-payment',
    deprecated_at: '2026-01-10'
  }), {
    status: 410,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
