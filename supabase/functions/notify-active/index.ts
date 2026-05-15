import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * DEPRECATED: A rota PATCH /ativo/{client_id} da API externa AWS foi descontinuada.
 * No-op preservado para compatibilidade com chamadores existentes.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const payload = await req.json().catch(() => ({}));
    console.log('⚠️ [NOTIFY-ACTIVE] PATCH /ativo descontinuado. No-op chamado com:', payload);
    return new Response(
      JSON.stringify({ success: true, skipped: true, reason: 'PATCH /ativo removido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
