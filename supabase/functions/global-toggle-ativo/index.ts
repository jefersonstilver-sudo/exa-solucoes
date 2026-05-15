// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

/**
 * DEPRECATED: A rota PATCH /ativo/{client_id} da API externa AWS foi descontinuada.
 * Esta function era responsável por orquestrar ativação/desativação via PATCH.
 * Mantida como no-op para preservar compatibilidade com chamadores existentes.
 */
serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    /* ignore */
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const clientId = pathParts[pathParts.length - 1];

  console.log('⚠️ [GLOBAL-TOGGLE] PATCH /ativo descontinuado. No-op chamado:', { clientId, payload });

  return new Response(JSON.stringify({
    ok: true,
    skipped: true,
    reason: 'PATCH /ativo removido — rota AWS descontinuada',
    client_id: clientId,
    activated: null,
    activated_result: { status: 'ok' },
    deactivation_results: []
  }), { status: 200, headers: corsHeaders });
});
