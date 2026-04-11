import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Get user from JWT and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Verify user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || !['admin', 'super_admin'].includes(userData.role)) {
      throw new Error('Unauthorized: Admin access required')
    }

    console.log('🔧 [FIX_LISTA_PAINEIS] Starting data correction for user:', user.id)

    // Step 1: Find all pedidos with empty lista_paineis or lista_predios
    const { data: pedidosToFix, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, lista_paineis, lista_predios, client_id, status')
      .or('lista_paineis.is.null,lista_paineis.eq.{},lista_predios.is.null,lista_predios.eq.{}')

    if (pedidosError) {
      console.error('❌ Error fetching pedidos:', pedidosError)
      throw pedidosError
    }

    console.log(`📋 [FIX_LISTA_PAINEIS] Found ${pedidosToFix?.length || 0} pedidos to fix`)

    const results = {
      total_pedidos_found: pedidosToFix?.length || 0,
      pedidos_fixed: 0,
      pedidos_skipped: 0,
      pedidos_failed: 0,
      details: [] as any[]
    }

    if (!pedidosToFix || pedidosToFix.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No pedidos found with empty lista_paineis',
          results
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Step 2: For each pedido, get contratos and extract IDs
    for (const pedido of pedidosToFix) {
      try {
        console.log(`\n🔍 [FIX_LISTA_PAINEIS] Processing pedido: ${pedido.id}`)

        // Get contratos for this pedido
        const { data: contratos, error: contratosError } = await supabase
          .from('contratos')
          .select('painel_id, predio_id')
          .eq('pedido_id', pedido.id)

        if (contratosError) {
          console.error(`❌ Error fetching contratos for pedido ${pedido.id}:`, contratosError)
          results.pedidos_failed++
          results.details.push({
            pedido_id: pedido.id,
            status: 'failed',
            error: contratosError.message
          })
          continue
        }

        if (!contratos || contratos.length === 0) {
          console.log(`⚠️ [FIX_LISTA_PAINEIS] No contratos found for pedido ${pedido.id}`)
          results.pedidos_skipped++
          results.details.push({
            pedido_id: pedido.id,
            status: 'skipped',
            reason: 'no_contratos_found'
          })
          continue
        }

        // Extract panel and building IDs
        const panelIds = contratos
          .map(c => c.painel_id)
          .filter(Boolean)
          .filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates

        const buildingIds = contratos
          .map(c => c.predio_id)
          .filter(Boolean)
          .filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates

        console.log(`📋 [FIX_LISTA_PAINEIS] Pedido ${pedido.id}:`)
        console.log(`   - Found ${contratos.length} contratos`)
        console.log(`   - Panel IDs:`, panelIds)
        console.log(`   - Building IDs:`, buildingIds)

        // Update pedido with extracted IDs
        const { error: updateError } = await supabase
          .from('pedidos')
          .update({
            lista_paineis: panelIds,
            lista_predios: buildingIds
          })
          .eq('id', pedido.id)

        if (updateError) {
          console.error(`❌ Error updating pedido ${pedido.id}:`, updateError)
          results.pedidos_failed++
          results.details.push({
            pedido_id: pedido.id,
            status: 'failed',
            error: updateError.message
          })
          continue
        }

        console.log(`✅ [FIX_LISTA_PAINEIS] Successfully updated pedido ${pedido.id}`)
        results.pedidos_fixed++
        results.details.push({
          pedido_id: pedido.id,
          status: 'fixed',
          panel_ids_added: panelIds,
          building_ids_added: buildingIds,
          contratos_count: contratos.length
        })

      } catch (error) {
        console.error(`❌ Error processing pedido ${pedido.id}:`, error)
        results.pedidos_failed++
        results.details.push({
          pedido_id: pedido.id,
          status: 'failed',
          error: error.message
        })
      }
    }

    // Log system event
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'DATA_CORRECTION_LISTA_PAINEIS',
      user_id: user.id,
      metadata: {
        admin_id: user.id,
        results
      }
    })

    console.log('\n📊 [FIX_LISTA_PAINEIS] Final results:', results)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Data correction completed. Fixed ${results.pedidos_fixed} pedidos.`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ [FIX_LISTA_PAINEIS] Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
