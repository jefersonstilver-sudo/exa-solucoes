// Daily read-only verification of master videos on AWS + building client presence probe.
// - default (cron): runs reconcile-video-masters-external with dry_run=true, then probes every
//   building on AWS and records problems in api_sync_logs and exa_alerts_history. Never fixes anything.
// - { action: 'check_clients', building_ids: [...] }: returns which buildings have no client on AWS (used by the order page).
import { createClient } from 'npm:@supabase/supabase-js@2.49.4'
import { checkAwsClient, clientIdFromBuilding } from '../_shared/aws-master.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(url, key, { auth: { persistSession: false } })
  const body = await req.json().catch(() => ({}))

  try {
    if (body.action === 'check_clients') {
      const ids: string[] = Array.isArray(body.building_ids) ? [...new Set(body.building_ids.map(String))].filter((id) => UUID.test(id)).slice(0, 80) : []
      const byClient = new Map<string, string[]>()
      for (const id of ids) byClient.set(clientIdFromBuilding(id), [...(byClient.get(clientIdFromBuilding(id)) || []), id])
      const out: any[] = []
      await Promise.all([...byClient.entries()].map(async ([clientId, bids]) => {
        const { presence } = await checkAwsClient(clientId)
        for (const bid of bids) out.push({ building_id: bid, client_id: clientId, presence })
      }))
      return json({ success: true, buildings: out })
    }

    // 1) Dry-run plan from the existing reconciler (no PATCH is sent).
    const planResp = await fetch(`${url}/functions/v1/reconcile-video-masters-external`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ dry_run: true }),
    })
    const planData = await planResp.json().catch(() => ({}))
    if (!planResp.ok || planData?.dry_run !== true) throw new Error(`Dry-run falhou: HTTP ${planResp.status} ${planData?.error || ''}`)

    const { data: masters } = await db.from('pedidos').select('id, nome_pedido, lista_predios').eq('is_master', true).in('status', ['ativo', 'video_aprovado'])
    const masterMap = new Map((masters || []).map((p: any) => [p.id, p]))

    const presenceCache = new Map<string, Awaited<ReturnType<typeof checkAwsClient>>>()
    const probe = async (clientId: string) => {
      if (!presenceCache.has(clientId)) presenceCache.set(clientId, await checkAwsClient(clientId))
      return presenceCache.get(clientId)!
    }

    const problems: any[] = []
    for (const entry of (planData.plan || []) as any[]) {
      const pedido: any = masterMap.get(entry.pedido_id)
      if (!pedido || !entry.master_true) continue
      for (const buildingId of [...new Set((pedido.lista_predios || []) as string[])]) {
        const clientId = clientIdFromBuilding(buildingId)
        const res = await probe(clientId)
        let issue: string | null = null
        if (res.presence === 'missing') issue = 'Prédio sem cliente na AWS'
        else if (res.presence === 'unknown') issue = `Não foi possível consultar a AWS (${res.detail || 'sem detalhe'})`
        // AWS file names use the storage name, not the title, and the API exposes no read of the master flag.
        if (issue) problems.push({ pedido_id: pedido.id, pedido: pedido.nome_pedido, building_id: buildingId, client_id: clientId, video: entry.master_true, issue })
      }
      // Recent master PATCH failures for this order also mean the flag may not be master=True.
      const { data: fails } = await db.from('api_sync_logs').select('building_id, error_message, created_at')
        .eq('pedido_id', pedido.id).eq('action', 'master_update').eq('status', 'error')
        .gte('created_at', new Date(Date.now() - 36 * 3600_000).toISOString()).limit(50)
      for (const f of fails || []) {
        problems.push({ pedido_id: pedido.id, pedido: pedido.nome_pedido, building_id: (f as any).building_id, client_id: clientIdFromBuilding((f as any).building_id || ''), video: entry.master_true, issue: `Última troca de master falhou: ${(f as any).error_message}` })
      }
    }

    if (problems.length > 0) {
      await db.from('api_sync_logs').insert(problems.map((p) => ({
        pedido_id: p.pedido_id, building_id: p.building_id || null, video_name: p.video, action: 'master_daily_check',
        status: 'warning', source: 'cron:master-video-daily-check', aws_response: { client_id: p.client_id, dry_run: true }, error_message: p.issue,
      })))
      const lines = problems.slice(0, 30).map((p) => `• ${p.pedido} — prédio ${p.client_id}: ${p.issue}`).join('\n')
      await db.from('exa_alerts_history').insert({
        tipo_alerta: 'aws_master_check', destinatario_telefone: 'sistema', destinatario_nome: 'Verificação diária AWS',
        mensagem_enviada: `⚠️ Verificação diária de vídeos master (somente leitura): ${problems.length} problema(s)\n${lines}`,
        status: 'logged', metadata: { problems, dry_run: true },
      })
    } else {
      await db.from('api_sync_logs').insert({ action: 'master_daily_check', status: 'success', source: 'cron:master-video-daily-check', aws_response: { dry_run: true, orders: masterMap.size } })
    }

    return json({ success: true, dry_run: true, master_orders: masterMap.size, problems })
  } catch (err: any) {
    console.error('❌ [MASTER_DAILY_CHECK]', err?.message || err)
    await db.from('api_sync_logs').insert({ action: 'master_daily_check', status: 'error', source: 'cron:master-video-daily-check', error_message: err?.message || String(err) })
    return json({ success: false, error: err?.message || String(err) }, 500)
  }
})
