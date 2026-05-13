import { corsHeaders, requireAdminCaller, requireValidSession, logAction } from '../_shared/impersonation.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId } = await requireAdminCaller(req);
    const body = await req.json().catch(() => ({}));
    const { session_id, action, entity_id, payload, pedido_id } = body;
    if (!session_id || !action) {
      return new Response(JSON.stringify({ error: 'session_id and action required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const session = await requireValidSession(session_id);
    if (session.admin_user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not your session' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    await logAction({
      session_id,
      admin_user_id: userId,
      target_user_id: session.target_user_id,
      pedido_id: pedido_id || session.target_pedido_id,
      action,
      entity_id,
      payload,
    });
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('log-impersonation-action error', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
