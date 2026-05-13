import { corsHeaders, getServiceClient, requireAdminCaller } from '../_shared/impersonation.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId } = await requireAdminCaller(req);
    const body = await req.json().catch(() => ({}));
    const { session_id, reason } = body;
    if (!session_id) {
      return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = getServiceClient();
    const endReason = reason === 'expired' ? 'expired' : reason === 'forced' ? 'forced' : 'manual';
    const { data, error } = await supabase
      .from('admin_impersonation_sessions')
      .update({ ended_at: new Date().toISOString(), end_reason: endReason })
      .eq('id', session_id)
      .eq('admin_user_id', userId)
      .is('ended_at', null)
      .select('id, target_user_id, target_pedido_id')
      .maybeSingle();

    if (error) throw error;

    if (data) {
      await supabase.from('admin_impersonation_actions').insert({
        session_id: data.id,
        admin_user_id: userId,
        target_user_id: data.target_user_id,
        pedido_id: data.target_pedido_id,
        action: 'session_end',
        payload: { reason: endReason },
      });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('end-impersonation error', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
