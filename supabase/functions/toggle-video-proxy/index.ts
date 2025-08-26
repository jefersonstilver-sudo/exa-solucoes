import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const N8N_WEBHOOK_BASE = Deno.env.get("N8N_WEBHOOK_URL") || "https://stilver.app.n8n.cloud/webhook/ATIVAR/DESATIVAR";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { buildingId, titulo, ativo } = await req.json();

    console.log("[toggle-video-proxy] 📥 RECEBIDO:", { 
      method: req.method, 
      buildingId, 
      titulo, 
      ativo,
      headers: Object.fromEntries(req.headers.entries())
    });

    if (!buildingId || typeof titulo !== "string" || typeof ativo !== "boolean") {
      console.error("[toggle-video-proxy] ❌ PAYLOAD INVÁLIDO:", { buildingId, titulo, ativo });
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payload. Expecting { buildingId, titulo, ativo }" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `${N8N_WEBHOOK_BASE}?building_id=${encodeURIComponent(buildingId)}`;
    const payload = { building_id: buildingId, titulo, ativo };

    console.log("[toggle-video-proxy] 🚀 ENVIANDO PATCH para n8n:", { 
      url, 
      payload,
      webhook_base: N8N_WEBHOOK_BASE,
      method: "PATCH"
    });

    const upstream = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      parsed = { raw: text };
    }

    if (!upstream.ok) {
      console.error("[toggle-video-proxy] ❌ N8N RETORNOU ERRO:", { 
        status: upstream.status, 
        statusText: upstream.statusText,
        response: parsed,
        url,
        payload 
      });
      return new Response(
        JSON.stringify({ success: false, status: upstream.status, response: parsed }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[toggle-video-proxy] ✅ N8N SUCESSO:", { 
      status: upstream.status, 
      response: parsed,
      buildingId,
      titulo,
      ativo 
    });

    return new Response(
      JSON.stringify({ success: true, status: upstream.status, response: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[toggle-video-proxy] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
