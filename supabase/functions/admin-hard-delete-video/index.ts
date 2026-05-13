// Hard delete de UM vídeo no contexto de impersonação:
// Remove pedido_videos, videos, schedules, storage e dispara remoção AWS.
import { corsHeaders, getServiceClient, requireAdminCaller, requireValidSession, logAction } from '../_shared/impersonation.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { userId } = await requireAdminCaller(req);
    const body = await req.json().catch(() => ({}));
    const { session_id, video_id, pedido_id } = body;
    if (!session_id || !video_id || !pedido_id) {
      return new Response(JSON.stringify({ error: 'session_id, video_id, pedido_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const session = await requireValidSession(session_id);
    if (session.admin_user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Not your session' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = getServiceClient();

    // Buscar vídeo + url para storage cleanup
    const { data: videoRow } = await supabase
      .from('videos')
      .select('id, nome, url, storage_path')
      .eq('id', video_id)
      .maybeSingle();

    // 1) Tentar deletar da AWS (não falha se erro)
    let awsResult: any = null;
    try {
      const awsResp = await supabase.functions.invoke('delete-video-from-external-api', {
        body: { video_id, pedido_id },
      });
      awsResult = awsResp;
    } catch (e) {
      console.warn('AWS delete falhou:', e);
      awsResult = { error: String(e) };
    }

    // 2) Remover schedules
    await supabase.from('video_schedules').delete().eq('video_id', video_id);

    // 3) Remover pedido_videos relacionados
    await supabase.from('pedido_videos').delete().eq('video_id', video_id).eq('pedido_id', pedido_id);

    // 4) Remover videos
    await supabase.from('videos').delete().eq('id', video_id);

    // 5) Tentar remover do storage (best-effort)
    if (videoRow?.storage_path) {
      try {
        await supabase.storage.from('videos').remove([videoRow.storage_path]);
      } catch (e) {
        console.warn('Storage remove falhou:', e);
      }
    }

    await logAction({
      session_id,
      admin_user_id: userId,
      target_user_id: session.target_user_id,
      pedido_id,
      action: 'delete_video',
      entity_id: video_id,
      payload: { video_nome: videoRow?.nome, aws: awsResult },
    });

    return new Response(JSON.stringify({ ok: true, video_id, aws: awsResult }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('admin-hard-delete-video error', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
