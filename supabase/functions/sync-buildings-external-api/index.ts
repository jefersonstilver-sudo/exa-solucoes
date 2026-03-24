import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EXTERNAL_API_BASE = 'http://15.228.8.3:8000'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { pedido_id, action, building_ids } = await req.json()

    if (!pedido_id || !action || !building_ids?.length) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`🔄 [SYNC-BUILDINGS] Action: ${action}, Pedido: ${pedido_id}, Buildings: ${building_ids.length}`)

    if (action === 'add') {
      // Get approved videos for this order
      const { data: videos, error: videoError } = await supabase
        .from('pedido_videos')
        .select('video_id, videos(nome, url, duracao, orientacao)')
        .eq('pedido_id', pedido_id)
        .eq('approval_status', 'approved')
        .eq('is_active', true)

      if (videoError) throw videoError

      if (!videos || videos.length === 0) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'No approved videos to sync',
          synced: 0 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get pedido details for tipo_produto
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('tipo_produto')
        .eq('id', pedido_id)
        .single()

      const isVertical = pedido?.tipo_produto === 'vertical_premium'

      // Get building prefixes
      const { data: buildings } = await supabase
        .from('buildings')
        .select('id, nome')
        .in('id', building_ids)

      let synced = 0
      const errors: string[] = []

      for (const building of buildings || []) {
        const prefix = building.id.substring(0, 4)
        
        for (const pv of videos) {
          const video = (pv as any).videos
          if (!video?.url) continue

          try {
            const metadata: any = {
              nome: video.nome,
              url: video.url,
              duracao: video.duracao,
              orientacao: video.orientacao,
              pedido_id: pedido_id,
              video_id: pv.video_id,
              building_id: building.id
            }

            if (isVertical) {
              metadata.isPlus = true
            }

            const response = await fetch(`${EXTERNAL_API_BASE}/geral/upload-arquivo/${prefix}/Propagandas`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(metadata)
            })

            if (response.ok) {
              synced++
              console.log(`✅ [SYNC-BUILDINGS] Video ${video.nome} synced to building ${building.nome}`)
            } else {
              const errText = await response.text()
              errors.push(`${building.nome}: ${errText}`)
            }
          } catch (e: any) {
            errors.push(`${building.nome}: ${e.message}`)
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: errors.length === 0, 
        synced, 
        errors 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'remove') {
      const errors: string[] = []
      let deleted = 0

      for (const buildingId of building_ids) {
        const prefix = buildingId.substring(0, 4)
        try {
          const response = await fetch(`${EXTERNAL_API_BASE}/geral/deletar-arquivos/${prefix}/Propagandas`, {
            method: 'DELETE'
          })

          if (response.ok) {
            deleted++
          } else {
            const errText = await response.text()
            errors.push(`${buildingId}: ${errText}`)
          }
        } catch (e: any) {
          errors.push(`${buildingId}: ${e.message}`)
        }
      }

      return new Response(JSON.stringify({ 
        success: errors.length === 0, 
        deleted, 
        errors 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('❌ [SYNC-BUILDINGS] Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
