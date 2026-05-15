import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EXTERNAL_API_BASE = 'http://18.228.252.149:8000'

type PedidoVideo = {
  id: string
  video_id: string
  slot_position: number | null
  is_active: boolean | null
  selected_for_display: boolean | null
  approval_status: string | null
  created_at: string
  videos: { nome: string | null } | null
}

type Pedido = {
  id: string
  status: string | null
  lista_predios: string[] | null
  is_master: boolean | null
  pedido_videos: PedidoVideo[] | null
}

function stripExt(value: string | null | undefined) {
  return (value || '').replace(/\.[^/.]+$/, '')
}

function clientIdFromBuilding(buildingId: string) {
  return String(buildingId || '').replace(/-/g, '').substring(0, 4)
}

function sortVideos(a: PedidoVideo, b: PedidoVideo) {
  const slotA = a.slot_position ?? 999
  const slotB = b.slot_position ?? 999
  if (slotA !== slotB) return slotA - slotB
  return String(a.created_at || '').localeCompare(String(b.created_at || ''))
}

function pickMaster(videos: PedidoVideo[]) {
  const approved = videos.filter((video) => video.approval_status === 'approved' && stripExt(video.videos?.nome))
  const selectedActive = approved.filter((video) => video.selected_for_display === true && video.is_active === true).sort(sortVideos)
  if (selectedActive.length > 0) return selectedActive[0]

  const selectedAny = approved.filter((video) => video.selected_for_display === true).sort(sortVideos)
  if (selectedAny.length > 0) return selectedAny[0]

  const activeAny = approved.filter((video) => video.is_active === true).sort(sortVideos)
  if (activeAny.length > 0) return activeAny[0]

  return approved.sort(sortVideos)[0] || null
}

async function patchMaster(clientId: string, pedidoId: string, activateTitle: string, deactivateTitle: string) {
  const endpoint = `${EXTERNAL_API_BASE}/master/${clientId}`
  const body = {
    cliente_id: clientId,
    pedido_id: pedidoId,
    ativar_master: activateTitle,
    desativar_master: deactivateTitle,
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const text = await response.text()
    return {
      ok: response.ok,
      status: response.status,
      endpoint,
      request: body,
      response: text.substring(0, 500),
    }
  } finally {
    clearTimeout(timer)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json().catch(() => ({}))
    const dryRun = body.dry_run !== false
    const pedidoIds: string[] | null = Array.isArray(body.pedido_ids) && body.pedido_ids.length > 0 ? body.pedido_ids : null
    const includeChildBuildings = body.include_child_buildings !== false

    let query = supabase
      .from('pedidos')
      .select(`
        id,
        status,
        lista_predios,
        is_master,
        pedido_videos (
          id,
          video_id,
          slot_position,
          is_active,
          selected_for_display,
          approval_status,
          created_at,
          videos ( nome )
        )
      `)
      .in('status', ['ativo', 'video_aprovado'])
      .order('id', { ascending: true })

    if (pedidoIds) query = query.in('id', pedidoIds)

    const { data: pedidos, error } = await query
    if (error) throw error

    const plan: any[] = []
    const results: any[] = []
    let totalCalls = 0
    let successCalls = 0
    let failedCalls = 0

    for (const pedido of ((pedidos || []) as Pedido[])) {
      const approvedVideos = (pedido.pedido_videos || []).filter((video) => video.approval_status === 'approved' && stripExt(video.videos?.nome))
      const masterVideo = pickMaster(approvedVideos)

      if (!masterVideo) {
        plan.push({ pedido_id: pedido.id, status: 'skipped', reason: 'sem vídeos aprovados com título' })
        continue
      }

      let buildingIds = Array.isArray(pedido.lista_predios) ? [...pedido.lista_predios] : []

      if (includeChildBuildings && pedido.is_master) {
        const { data: childOrders, error: childError } = await supabase
          .from('pedidos')
          .select('lista_predios')
          .eq('master_pedido_id', pedido.id)
          .in('status', ['ativo', 'video_aprovado'])
        if (childError) throw childError
        for (const child of childOrders || []) {
          const childBuildings = Array.isArray((child as any).lista_predios) ? (child as any).lista_predios : []
          buildingIds.push(...childBuildings)
        }
      }

      buildingIds = [...new Set(buildingIds)].filter(Boolean)
      if (buildingIds.length === 0) {
        plan.push({ pedido_id: pedido.id, status: 'skipped', reason: 'sem prédios' })
        continue
      }

      const masterTitle = stripExt(masterVideo.videos?.nome)
      const nonMasterTitles = approvedVideos
        .filter((video) => video.id !== masterVideo.id)
        .map((video) => stripExt(video.videos?.nome))
        .filter((title, index, arr) => title && arr.indexOf(title) === index)

      const deactivateTitles = nonMasterTitles.length > 0 ? nonMasterTitles : ['']
      const callsForPedido = buildingIds.length * deactivateTitles.length
      totalCalls += callsForPedido

      const pedidoPlan = {
        pedido_id: pedido.id,
        buildings: buildingIds.map((id) => clientIdFromBuilding(id)),
        master_true: masterTitle,
        master_false: nonMasterTitles,
        calls: callsForPedido,
      }
      plan.push(pedidoPlan)

      if (dryRun) continue

      const pedidoResults: any[] = []
      for (const buildingId of buildingIds) {
        const clientId = clientIdFromBuilding(buildingId)
        for (const deactivateTitle of deactivateTitles) {
          try {
            console.log(`📤 [RECONCILE_MASTER] PATCH /master/${clientId}`, { pedido_id: pedido.id, masterTitle, deactivateTitle })
            const result = await patchMaster(clientId, pedido.id, masterTitle, deactivateTitle)
            pedidoResults.push(result)
            if (result.ok) successCalls++
            else failedCalls++
          } catch (callError: any) {
            failedCalls++
            pedidoResults.push({ ok: false, clientId, pedido_id: pedido.id, error: callError?.message || String(callError) })
          }
        }
      }

      const pedidoOk = pedidoResults.every((result) => result.ok)
      await supabase.from('api_sync_logs').insert({
        pedido_id: pedido.id,
        action: 'reconcile_video_master',
        status: pedidoOk ? 'success' : 'error',
        source: 'reconcile-video-masters-external',
        aws_response: {
          master_true: masterTitle,
          master_false: nonMasterTitles,
          results: pedidoResults,
        },
        error_message: pedidoOk ? null : 'Uma ou mais chamadas PATCH /master falharam',
      })

      results.push({ ...pedidoPlan, ok: pedidoOk, results: pedidoResults })
    }

    return new Response(JSON.stringify({
      success: failedCalls === 0,
      dry_run: dryRun,
      orders: plan.length,
      total_calls: totalCalls,
      success_calls: successCalls,
      failed_calls: failedCalls,
      plan,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('❌ [RECONCILE_MASTER] Erro:', error?.message || error)
    return new Response(JSON.stringify({ success: false, error: error?.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
