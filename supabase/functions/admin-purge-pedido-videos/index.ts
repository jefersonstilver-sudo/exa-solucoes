// Hard delete de TODOS os vídeos de um pedido. Exige confirmação textual (nome cliente OU id pedido).
import { corsHeaders, getServiceClient, requireAdminCaller, requireValidSession, logAction } from '../_shared/impersonation.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId } = await requireAdminCaller(req);
    const body = await req.json().catch(() => ({}));
    const { session_id, pedido_id, confirmation_text } = body;
    if (!session_id || !pedido_id || !confirmation_text) {
      return new Response(JSON.stringify({ error: 'session_id, pedido_id, confirmation_text required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const session = await requireValidSession(session_id);
    if (session.admin_user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not your session' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = getServiceClient();

    // Buscar pedido + cliente p/ validar confirmação
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, client_id')
      .eq('id', pedido_id)
      .maybeSingle();
    if (!pedido) {
      return new Response(JSON.stringify({ error: 'Pedido not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: client } = await supabase
      .from('users')
      .select('email, nome')
      .eq('id', pedido.client_id)
      .maybeSingle();

    const confLower = String(confirmation_text).trim().toLowerCase();
    const valid =
      confLower === pedido.id.toLowerCase() ||
      (client?.email && confLower === client.email.toLowerCase()) ||
      (client?.nome && confLower === client.nome.toLowerCase());
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Confirmation text mismatch' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Buscar todos vídeos
    const { data: pvs } = await supabase
      .from('pedido_videos')
      .select('id, video_id, videos(id, nome, storage_path)')
      .eq('pedido_id', pedido_id)
      .not('video_id', 'is', null);

    let deleted = 0;
    const errors: any[] = [];

    for (const pv of (pvs || []) as any[]) {
      const vid = pv.video_id;
      if (!vid) continue;
      try {
        try {
          await supabase.functions.invoke('delete-video-from-external-api', { body: { video_id: vid, pedido_id } });
        } catch (e) { console.warn('AWS delete failed', e); }
        await supabase.from('video_schedules').delete().eq('video_id', vid);
        await supabase.from('pedido_videos').delete().eq('video_id', vid).eq('pedido_id', pedido_id);
        await supabase.from('videos').delete().eq('id', vid);
        if (pv.videos?.storage_path) {
          try { await supabase.storage.from('videos').remove([pv.videos.storage_path]); } catch (_) {}
        }
        deleted++;
      } catch (e: any) {
        errors.push({ video_id: vid, error: String(e?.message || e) });
      }
    }

    await logAction({
      session_id,
      admin_user_id: userId,
      target_user_id: session.target_user_id,
      pedido_id,
      action: 'purge_pedido',
      entity_id: pedido_id,
      payload: { deleted, errors, total_attempted: pvs?.length || 0 },
    });

    return new Response(JSON.stringify({ ok: true, deleted, errors }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('admin-purge-pedido-videos error', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
