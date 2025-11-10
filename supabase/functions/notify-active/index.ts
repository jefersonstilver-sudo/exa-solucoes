// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, buildingUuid, titulo, ativo } = await req.json().catch(() => ({ 
      clientId: null, 
      buildingUuid: null,
      titulo: null,
      ativo: true
    }));

    if (!clientId || typeof clientId !== 'string' || clientId.length < 1) {
      return new Response(JSON.stringify({ ok: false, error: 'clientId inválido ou ausente' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!titulo || typeof titulo !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'titulo inválido ou ausente' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const url = `http://15.228.8.3:8000/ativo/${clientId}`;
    const body = {
      titulo,
      ativo: ativo === true
    };

    console.log('[notify-active] PATCH', { url, buildingUuid, clientId, body });

    const res = await fetch(url, { 
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const text = await res.text().catch(() => '');

    console.log('[notify-active] response', { status: res.status, statusText: res.statusText, responseBody: text });

    return new Response(
      JSON.stringify({ 
        ok: res.ok, 
        status: res.status, 
        statusText: res.statusText, 
        url, 
        buildingUuid, 
        requestBody: body,
        responseBody: text 
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (e: any) {
    console.error('[notify-active] error', e?.message || e);
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'unknown error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
});

