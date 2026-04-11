import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EXTERNAL_API_BASE = 'http://18.228.252.149:8000'

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
        .select('video_id, selected_for_display, videos(nome, url, duracao, orientacao)')
        .eq('pedido_id', pedido_id)
        .eq('approval_status', 'approved')

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

      // Get pedido details
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('tipo_produto, data_inicio, data_fim')
        .eq('id', pedido_id)
        .single()

      const isVertical = pedido?.tipo_produto === 'vertical_premium'

      // Use RPC to determine which video is currently active (dynamic scheduling)
      let currentDisplayVideoId: string | null = null
      try {
        const { data: displayData } = await supabase.rpc('get_current_display_video', {
          p_pedido_id: pedido_id
        })
        if (displayData && displayData.length > 0) {
          currentDisplayVideoId = displayData[0].video_id
        }
        console.log(`🎯 [SYNC-BUILDINGS] Current display video from RPC: ${currentDisplayVideoId}`)
      } catch (rpcError: any) {
        console.error(`⚠️ [SYNC-BUILDINGS] RPC error, falling back to selected_for_display:`, rpcError.message)
      }

      // Build client_ids: first 4 chars of each building UUID (no hyphens)
      const clientIds = building_ids.map((id: string) => id.replace(/-/g, '').substring(0, 4))
      console.log(`📋 [SYNC-BUILDINGS] client_ids: ${JSON.stringify(clientIds)}`)

      // Download video files from Supabase Storage and build metadata
      const formData = new FormData()
      const metadados: Record<string, any> = {}

      for (const pv of videos) {
        const video = (pv as any).videos
        if (!video?.url) continue

        // Extract filename from URL (same logic as sync-video-status-to-aws extractTitulo)
        // This ensures the name matches what global-toggle-ativo sends in PATCH
        const extractFileNameFromUrl = (videoUrl?: string | null): string | null => {
          if (!videoUrl) return null;
          const base = String(videoUrl).split("/").pop() || "";
          const cleaned = base.split("?")[0].split("#")[0].trim();
          return cleaned || null;
        };
        const fileNameClean = extractFileNameFromUrl(video.url) || video.nome || `video_${pv.video_id}.mp4`
        console.log(`📝 [SYNC-BUILDINGS] Video nome="${video.nome}", URL-extracted title="${fileNameClean}"`);

        // Download video from Supabase Storage
        try {
          // Extract storage path from URL
          const urlParts = video.url.split('/storage/v1/object/public/')
          if (urlParts.length < 2) {
            console.error(`⚠️ [SYNC-BUILDINGS] Invalid storage URL for video: ${video.url}`)
            continue
          }
          const fullPath = urlParts[1]
          const bucketName = fullPath.split('/')[0]
          const filePath = fullPath.substring(bucketName.length + 1)

          const { data: fileData, error: downloadError } = await supabase.storage
            .from(bucketName)
            .download(filePath)

          if (downloadError || !fileData) {
            console.error(`⚠️ [SYNC-BUILDINGS] Failed to download video ${fileNameClean}:`, downloadError)
            continue
          }

          if (fileData.size === 0) {
            console.error(`⚠️ [SYNC-BUILDINGS] Empty file for video ${fileNameClean}`)
            continue
          }

          console.log(`📥 [SYNC-BUILDINGS] Downloaded ${fileNameClean} (${(fileData.size / 1024 / 1024).toFixed(2)} MB)`)

          // Append file to FormData
          formData.append('files', fileData, fileNameClean)

          // Build metadata for this video
          const dataIni = pedido?.data_inicio 
            ? new Date(pedido.data_inicio).toISOString().replace('Z', '')
            : new Date().toISOString().replace('Z', '')
          const dataFim = pedido?.data_fim
            ? new Date(pedido.data_fim).toISOString().replace('Z', '')
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().replace('Z', '')

          metadados[fileNameClean] = {
            titulo: video.nome || 'Campanha',
            data_ini: dataIni,
            data_fim: dataFim,
            ativo: currentDisplayVideoId ? (pv.video_id === currentDisplayVideoId) : (pv.selected_for_display === true),
            isPlus: isVertical,
            programacao: {
              domingo: [{ inicio: "00:00", fim: "23:59" }],
              segunda: [{ inicio: "00:00", fim: "23:59" }],
              terça: [{ inicio: "00:00", fim: "23:59" }],
              quarta: [{ inicio: "00:00", fim: "23:59" }],
              quinta: [{ inicio: "00:00", fim: "23:59" }],
              sexta: [{ inicio: "00:00", fim: "23:59" }],
              sábado: [{ inicio: "00:00", fim: "23:59" }]
            }
          }
        } catch (dlError: any) {
          console.error(`⚠️ [SYNC-BUILDINGS] Error downloading ${fileNameClean}:`, dlError.message)
          continue
        }
      }

      // Check if we have any files to send
      if (Object.keys(metadados).length === 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'No video files could be downloaded for sync' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Append client_ids and metadados as JSON strings
      formData.append('client_ids', JSON.stringify(clientIds))
      formData.append('metadados', JSON.stringify(metadados))

      console.log(`🚀 [SYNC-BUILDINGS] Sending ${Object.keys(metadados).length} videos to ${clientIds.length} buildings`)
      console.log(`📋 [SYNC-BUILDINGS] Metadados: ${JSON.stringify(metadados)}`)

      // POST to external API
      const response = await fetch(`${EXTERNAL_API_BASE}/propagandas/admin/add-to-specific-buildings`, {
        method: 'POST',
        body: formData
      })

      const responseText = await response.text()
      console.log(`📡 [SYNC-BUILDINGS] API Response [${response.status}]: ${responseText}`)

      let responseData: any = {}
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = { raw: responseText }
      }

      if (!response.ok) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `AWS API returned ${response.status}`,
          details: responseData
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        synced: Object.keys(metadados).length,
        buildings: clientIds.length,
        apiResponse: responseData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } else if (action === 'remove') {
      const errors: string[] = []
      let deleted = 0

      // Buscar vídeos aprovados do pedido para saber quais arquivos deletar
      const { data: pedidoVideos, error: pvError } = await supabase
        .from('pedido_videos')
        .select('video_id, videos(nome, url)')
        .eq('pedido_id', pedido_id)
        .eq('approval_status', 'approved')
        .eq('is_active', true)

      if (pvError) {
        console.error('⚠️ [SYNC-BUILDINGS] Erro ao buscar vídeos do pedido:', pvError)
      }

      // Extrair nomes de arquivo das URLs
      const fileNames: string[] = []
      if (pedidoVideos) {
        for (const pv of pedidoVideos) {
          const video = (pv as any).videos
          if (!video?.url) continue
          const base = String(video.url).split("/").pop() || ""
          const cleaned = base.split("?")[0].split("#")[0].trim()
          if (cleaned) fileNames.push(cleaned)
        }
      }

      console.log(`🗑️ [SYNC-BUILDINGS] Removendo ${fileNames.length} vídeo(s) de ${building_ids.length} prédio(s)`)

      for (const buildingId of building_ids) {
        const prefix = buildingId.replace(/-/g, '').substring(0, 4)
        
        for (const videoFileName of fileNames) {
          try {
            const formData = new FormData()
            formData.append('video_name', videoFileName)

            console.log(`🔄 [SYNC-BUILDINGS] DELETE /propagandas/admin/delete-propaganda/${prefix} video_name=${videoFileName}`)

            const response = await fetch(`${EXTERNAL_API_BASE}/propagandas/admin/delete-propaganda/${prefix}`, {
              method: 'DELETE',
              body: formData
            })

            if (response.ok) {
              deleted++
              console.log(`✅ [SYNC-BUILDINGS] Deletado ${videoFileName} do prédio ${prefix}`)
            } else {
              const errText = await response.text()
              console.error(`❌ [SYNC-BUILDINGS] Erro ao deletar ${videoFileName} do prédio ${prefix}: ${errText}`)
              errors.push(`${buildingId}/${videoFileName}: ${errText}`)
            }
          } catch (e: any) {
            errors.push(`${buildingId}/${videoFileName}: ${e.message}`)
          }
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
