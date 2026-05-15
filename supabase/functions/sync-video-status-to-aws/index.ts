import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

/**
 * DEPRECATED: A rota PATCH /ativo/batch da API externa AWS foi descontinuada.
 * Esta function é mantida como no-op para preservar compatibilidade com chamadores
 * existentes (callers ainda invocam mas nada é enviado para a AWS).
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json().catch(() => ({}));
    console.log('⚠️ [AWS_SYNC] PATCH /ativo/batch foi descontinuado. No-op chamado com:', payload);

    return new Response(
      JSON.stringify({
        success: true,
        skipped: true,
        reason: 'PATCH /ativo/batch removido — rota AWS descontinuada',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
