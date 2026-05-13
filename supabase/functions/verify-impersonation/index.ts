import { corsHeaders, getServiceClient, requireAdminCaller, requireValidSession } from '../_shared/impersonation.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId } = await requireAdminCaller(req);
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const session = await requireValidSession(sessionId);
    if (session.admin_user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not your session' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = getServiceClient();
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, email, nome')
      .eq('id', session.target_user_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        session_id: session.id,
        admin_user_id: session.admin_user_id,
        target_user_id: session.target_user_id,
        target_pedido_id: session.target_pedido_id,
        expires_at: session.expires_at,
        target_user: targetUser,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('verify-impersonation error', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
