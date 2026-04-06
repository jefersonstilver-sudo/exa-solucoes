import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse optional params
    let source = 'audit'
    let executedBy: string | null = null
    try {
      const body = await req.json()
      source = body.source || 'audit'
      executedBy = body.executed_by || null
    } catch { /* no body = cron call */ }

    console.log(`🔍 [AUDIT] Starting full audit sync. Source: ${source}`)

    // 1. Fetch all active orders
    const { data: orders, error: ordersError } = await supabase
      .from('pedidos')
      .select('id, lista_predios, is_master, status')
      .in('status', ['ativo', 'video_aprovado'])

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

    for (const order of orders) {
      try {
        // Collect building IDs - for master orders, include child orders' buildings
        let buildingIds: string[] = order.lista_predios || []

        if (order.is_master) {
          console.log(`👑 [AUDIT] Master order ${order.id} - fetching child orders`)
          const { data: childOrders } = await supabase
            .from('pedidos')
            .select('lista_predios')
            .eq('master_pedido_id', order.id)
            .in('status', ['ativo', 'video_aprovado'])

          if (childOrders) {
            for (const child of childOrders) {
              const childBuildings: string[] = child.lista_predios || []
              buildingIds = [...new Set([...buildingIds, ...childBuildings])]
            }
          }
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

        if (syncResponse.ok && syncData.success) {
          synced++
          details.push({
            pedido_id: order.id,
            status: 'success',
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
              status: 'success',
              source,
              executed_by: executedBy,
              aws_response: syncData
            })
          }
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
      success: true,
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
