/**
 * @deprecated Esta Edge Function foi descontinuada em 2026-01-10.
 * Mercado Pago foi removido do sistema EXA.
 * Use asaas-webhook para processamento de pagamentos.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('⚠️ [DEPRECATED] mercadopago-card-webhook chamado - endpoint descontinuado');

  return new Response(JSON.stringify({
    error: 'Endpoint descontinuado',
    message: 'Mercado Pago foi removido do sistema EXA. Use asaas-webhook.',
    status: 'deprecated',
    alternative: 'asaas-webhook',
    deprecated_at: '2026-01-10'
  }), {
    status: 410,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
