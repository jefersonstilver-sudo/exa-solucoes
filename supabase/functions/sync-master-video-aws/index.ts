// Automatic AWS sync for MASTER orders (is_master=true).
// Fired by database triggers when a master order's video is inserted/approved,
// becomes the base/selected video, or is renamed. It re-uploads the video when
// needed and switches the master flag on every building of lista_predios.
// Acts only on current database state, so repeated calls are harmless.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4'
import { stripExt } from '../_shared/aws-master.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const REASONS = new Set(['inserted', 'approved', 'became_base', 'renamed', 'manual'])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(url, key, { auth: { persistSession: false } })

  const body = await req.json().catch(() => ({}))
  const pedidoId = String(body.pedido_id || '')
  const pedidoVideoId = body.pedido_video_id ? String(body.pedido_video_id) : null
  const reason = String(body.reason || 'manual')
  const previousTitleInput = typeof body.previous_title === 'string' ? stripExt(body.previous_title).slice(0, 300) : null
  if (!UUID.test(pedidoId) || (pedidoVideoId && !UUID.test(pedidoVideoId)) || !REASONS.has(reason)) {
    return json({ error: 'Parâmetros inválidos' }, 400)
  }

  try {
    const { data: pedido, error } = await db.from('pedidos')
      .select('id, is_master, status, lista_predios, pedido_videos(id, is_base_video, is_active, selected_for_display, approval_status, slot_position, videos(nome))')
      .eq('id', pedidoId).maybeSingle()
    if (error) throw error
    if (!pedido || !(pedido as any).is_master) return json({ skipped: true, reason: 'pedido não é master' })
    if (!['ativo', 'video_aprovado'].includes((pedido as any).status)) return json({ skipped: true, reason: 'pedido inativo' })

    const approved = ((pedido as any).pedido_videos || []).filter((v: any) => v.approval_status === 'approved' && stripExt(v.videos?.nome))
    const rank = (v: any) => (v.selected_for_display ? 0 : 4) + (v.is_base_video ? 0 : 2) + (v.is_active ? 0 : 1)
    const base = [...approved].sort((a: any, b: any) => rank(a) - rank(b) || (a.slot_position ?? 99) - (b.slot_position ?? 99))[0]
    if (!base) return json({ skipped: true, reason: 'sem vídeo aprovado' })
    const ativar = stripExt(base.videos?.nome)

    // Previous master title: explicit (rename) → last successful master title logged → none.
    let desativar = previousTitleInput || ''
    if (!desativar) {
      const { data: last } = await db.from('api_sync_logs').select('video_name')
        .eq('pedido_id', pedidoId).in('action', ['master_update', 'master_auto_sync']).eq('status', 'success')
        .neq('video_name', ativar).order('created_at', { ascending: false }).limit(1).maybeSingle()
      desativar = stripExt((last as any)?.video_name) || ''
    }
    if (desativar === ativar) desativar = ''

    // Dedupe bursts of trigger events for the same switch.
    const since = new Date(Date.now() - 90_000).toISOString()
    const { data: recent } = await db.from('api_sync_logs').select('id, aws_response')
      .eq('pedido_id', pedidoId).eq('action', 'master_auto_sync').eq('video_name', ativar).gte('created_at', since).limit(5)
    if (reason !== 'renamed' && (recent || []).some((r: any) => (r.aws_response?.desativar || '') === desativar && r.aws_response?.stage === 'done')) {
      return json({ skipped: true, reason: 'sincronização idêntica recente' })
    }

    const call = async (fn: string, payload: unknown) => {
      const resp = await fetch(`${url}/functions/v1/${fn}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(payload),
      })
      const text = await resp.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch { data = { raw: text.slice(0, 500) } }
      return { ok: resp.ok, status: resp.status, data }
    }

    // 1) Upload the video to AWS when it is new/approved/renamed (ensures the file exists everywhere).
    let upload: any = null
    const uploadTarget = pedidoVideoId && approved.some((v: any) => v.id === pedidoVideoId) ? pedidoVideoId : (reason === 'renamed' ? base.id : null)
    if (uploadTarget && reason !== 'became_base') {
      upload = await call('upload-video-to-external-api', { pedido_video_id: uploadTarget })
    }

    // 2) Switch master on every building of the order.
    const master = await call('update-video-master-aws', {
      pedido_id: pedidoId, ativar_titulo: ativar, desativar_titulo: desativar || null, source: 'sync-master-video-aws',
    })
    const ok = master.ok && master.data?.success === true && (!upload || (upload.ok && upload.data?.success !== false))

    await db.from('api_sync_logs').insert({
      pedido_id: pedidoId, video_name: ativar, action: 'master_auto_sync', status: ok ? 'success' : 'error',
      source: `trigger:${reason}`,
      aws_response: {
        stage: 'done', ativar, desativar, pedido_video_id: pedidoVideoId,
        upload: upload ? { ok: upload.ok, status: upload.status, success: upload.data?.success ?? null, message: upload.data?.message ?? upload.data?.error ?? null } : null,
        failed_buildings: master.data?.failed_buildings || [], missing_clients: master.data?.missing_clients || [],
      },
      error_message: ok ? null : (master.data?.error || upload?.data?.error || `HTTP ${master.status}`),
    })

    return json({ success: ok, ativar, desativar, upload: upload?.data ?? null, master: master.data })
  } catch (err: any) {
    console.error('❌ [SYNC_MASTER_VIDEO]', err?.message || err)
    await db.from('api_sync_logs').insert({
      pedido_id: pedidoId, action: 'master_auto_sync', status: 'error', source: `trigger:${reason}`,
      error_message: err?.message || String(err),
    })
    return json({ success: false, error: err?.message || String(err) }, 500)
  }
})
