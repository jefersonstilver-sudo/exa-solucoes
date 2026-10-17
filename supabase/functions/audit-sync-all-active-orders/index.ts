import { authorizeOrderSync } from '../_shared/order-sync-auth.ts'
import { collectOrderBuildings, eligibleForOrderSync, orderSyncOutcome } from '../_shared/order-sync-policy.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const auth = await authorizeOrderSync(req)
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const { db: supabase, key: supabaseKey, url: supabaseUrl, userId: executedBy } = auth

    // Parse optional params
    let source = 'audit'
    let pedidoId: string | null = null
    let dryRun = false
    try {
      const body = await req.json()
      source = body.source || 'audit'
      pedidoId = body.pedido_id || null
      dryRun = body.dry_run === true
    } catch { /* no body = cron call */ }

    console.log(`🔍 [AUDIT] Starting full audit sync. Source: ${source}`)

    // 1. Fetch all active orders
    let query = supabase
      .from('pedidos')
      .select('id, lista_predios, is_master, status, data_fim')
      .in('status', ['ativo', 'video_aprovado'])
      .order('id')
    if (pedidoId) query = query.eq('id', pedidoId)
    const orders: any[] = []
    for (let offset = 0; offset < 1000; offset += 100) {
      const { data: page, error } = await query.range(offset, offset + 99)
      if (error) throw error
      orders.push(...(page || []))
      if (!page || page.length < 100) break
      if (offset === 900) throw new Error('Audit exceeds the safe 1000-order limit')
    }
    const ordersError = null

    if (ordersError) throw ordersError

    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({
        success: true, total_orders: 0, synced: 0, failed: 0, details: []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log(`📋 [AUDIT] Found ${orders.length} active orders`)

    const details: any[] = []
    let synced = 0
    let failed = 0
    let pending = 0
    const today = new Date().toISOString().slice(0, 10)

    for (const order of orders) {
      try {
        if (!eligibleForOrderSync(order, today)) {
          details.push({ pedido_id: order.id, status: 'skipped', message: 'Vigência encerrada; não reenviado', buildings: 0 })
          continue
        }
        // Collect building IDs - for master orders, include child orders' buildings
        let buildingIds: string[] = order.lista_predios || []

        if (order.is_master) {
          console.log(`👑 [AUDIT] Master order ${order.id} - fetching child orders`)
          const { data: childOrders, error: childError } = await supabase
            .from('pedidos')
            .select('lista_predios, status, data_fim')
            .eq('master_pedido_id', order.id)
            .in('status', ['ativo', 'video_aprovado'])

          if (childError) throw childError
          buildingIds = collectOrderBuildings(buildingIds, (childOrders || []).filter(child => eligibleForOrderSync(child, today)))
          console.log(`👑 [AUDIT] Master order total buildings: ${buildingIds.length}`)
        }

        if (buildingIds.length === 0) {
          details.push({ pedido_id: order.id, status: 'skipped', message: 'No buildings', buildings: 0 })
          
          // Log skipped
          await supabase.from('api_sync_logs').insert({
            pedido_id: order.id,
            action: 'audit',
            status: 'skipped',
            source,
            executed_by: executedBy,
            error_message: 'No buildings associated'
          })
          continue
        }

        buildingIds = collectOrderBuildings(buildingIds, [])
        if (dryRun) {
          details.push({ pedido_id: order.id, status: 'planned', buildings: buildingIds.length, building_ids: buildingIds, is_master: order.is_master })
          continue
        }
        // Call sync-buildings-external-api
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-buildings-external-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            pedido_id: order.id,
            action: 'add',
            building_ids: buildingIds
          })
        })

        const syncText = await syncResponse.text()
        let syncData: any = {}
        try { syncData = JSON.parse(syncText) } catch { syncData = { raw: syncText } }

        const outcome = orderSyncOutcome(syncData.expected_videos ?? syncData.synced ?? 0, syncData.synced ?? 0, syncData.apiResponse || {})
        if (syncResponse.ok && syncData.success && (syncData.synced || 0) > 0 && outcome !== 'error') {
          if (outcome === 'pending') pending++
          else synced++
          details.push({
            pedido_id: order.id,
            status: outcome,
            task_ids: syncData.task_ids || [],
            buildings: buildingIds.length,
            synced_videos: syncData.synced || 0,
            is_master: order.is_master || false
          })

          // Log success for each building
          for (const bid of buildingIds) {
            await supabase.from('api_sync_logs').insert({
              pedido_id: order.id,
              building_id: bid,
              action: 'audit',
              status: outcome,
              source,
              executed_by: executedBy,
              aws_response: syncData
            })
          }
        } else if (syncResponse.ok && syncData.success && (syncData.synced || 0) === 0) {
          details.push({ pedido_id: order.id, status: 'skipped', message: 'Sem vídeos aprovados para reenviar', buildings: buildingIds.length })
        } else {
          failed++
          details.push({
            pedido_id: order.id,
            status: 'error',
            buildings: buildingIds.length,
            error: syncData.error || `HTTP ${syncResponse.status}`
          })

          // Log error
          await supabase.from('api_sync_logs').insert({
            pedido_id: order.id,
            action: 'audit',
            status: 'error',
            source,
            executed_by: executedBy,
            aws_response: syncData,
            error_message: syncData.error || `HTTP ${syncResponse.status}`
          })
        }

      } catch (orderErr: any) {
        failed++
        details.push({
          pedido_id: order.id,
          status: 'error',
          error: orderErr.message
        })

        await supabase.from('api_sync_logs').insert({
          pedido_id: order.id,
          action: 'audit',
          status: 'error',
          source,
          executed_by: executedBy,
          error_message: orderErr.message
        })
      }
    }

    console.log(`✅ [AUDIT] Complete. Total: ${orders.length}, Synced: ${synced}, Failed: ${failed}`)

    return new Response(JSON.stringify({
      success: failed === 0,
      pending,
      dry_run: dryRun,
      total_orders: orders.length,
      synced,
      failed,
      details
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('❌ [AUDIT] Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
