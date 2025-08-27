// deno-lint-ignore-file no-explicit-any
// notify-video-toggle edge function
// Forwards video toggle actions to the external n8n webhook with proper CORS

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Webhook URLs based on "ativo"
const WEBHOOK_URL_TRUE = 'https://stilver.app.n8n.cloud/webhook/ATIVAR/DESATIVAR';
const WEBHOOK_URL_FALSE = 'https://stilver.app.n8n.cloud/webhook/DESATIVANDO_VIDEO_FALSE';
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const actions = Array.isArray(body?.actions) ? body.actions : [];

    console.log(`🔔 [WEBHOOK] Received ${actions.length} actions:`, actions);

    if (!actions.length) {
      console.log('❌ [WEBHOOK] No actions provided');
      return new Response(
        JSON.stringify({ ok: false, message: 'No actions provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Execute all POSTs in parallel to the appropriate webhook per action
    const results = await Promise.allSettled(
      actions.map((a: any, idx: number) => {
        const payload = {
          titulo: a?.titulo ?? '',
          ativo: Boolean(a?.ativo),
          predio_id: a?.predio_id ?? a?.predioId ?? a?.building_id ?? null,
        };
        const url = payload.ativo ? WEBHOOK_URL_TRUE : WEBHOOK_URL_FALSE;
        console.log(`📤 [WEBHOOK][${idx + 1}/${actions.length}] Sending to ${url}:`, payload);
        return fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      })
    );

    const summarized = results.map((r, idx) => {
      if (r.status === 'fulfilled') {
        return { index: idx, ok: r.value.ok, status: r.value.status };
      }
      return { index: idx, ok: false, error: String(r.reason) };
    });

    const successCount = summarized.filter((r) => r.ok).length;
    const failureCount = summarized.length - successCount;

    console.log(`✅ [WEBHOOK] Completed: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ ok: true, successCount, failureCount, results: summarized }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err?.message ?? String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
