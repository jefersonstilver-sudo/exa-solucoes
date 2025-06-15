
export function createReturnUrls(returnUrl: string, pedidoId: string): { successUrl: string; failureUrl: string; pendingUrl: string } {
  const originUrl = returnUrl || 'https://app.indexamidia.com';
  return {
    successUrl: `${originUrl}/pedido-confirmado?id=${pedidoId}&status=approved`,
    failureUrl: `${originUrl}/checkout?error=payment_failed&id=${pedidoId}`,
    pendingUrl: `${originUrl}/pedido-confirmado?id=${pedidoId}&status=pending`
  };
}

export function createCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

export function handleCorsPreflightRequest() {
  return new Response(null, { headers: createCorsHeaders() });
}

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return { supabaseUrl, supabaseKey };
}
