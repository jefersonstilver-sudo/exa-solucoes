import { corsHeaders, getServiceClient, requireAdminCaller } from '../_shared/impersonation.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId } = await requireAdminCaller(req);
    const body = await req.json().catch(() => ({}));
    const { target_user_id, target_pedido_id } = body;

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: 'target_user_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = getServiceClient();
    const userAgent = req.headers.get('user-agent') || null;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || null;

    const { data: session, error } = await supabase
      .from('admin_impersonation_sessions')
      .insert({
        admin_user_id: userId,
        target_user_id,
        target_pedido_id: target_pedido_id || null,
        user_agent: userAgent,
        ip_address: ip,
      })
      .select('id, target_user_id, target_pedido_id, expires_at')
      .single();

    if (error) throw error;

    // Get target user info
    const { data: targetUser } = await supabase
      .from('users')
      .select('id, email, nome')
      .eq('id', target_user_id)
      .maybeSingle();

    // Log start
    await supabase.from('admin_impersonation_actions').insert({
      session_id: session.id,
      admin_user_id: userId,
      target_user_id,
      pedido_id: target_pedido_id || null,
      action: 'session_start',
      payload: { user_agent: userAgent, ip },
    });

    return new Response(
      JSON.stringify({
        session_id: session.id,
        target_user_id: session.target_user_id,
        target_pedido_id: session.target_pedido_id,
        expires_at: session.expires_at,
        target_user: targetUser,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('start-impersonation error', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
