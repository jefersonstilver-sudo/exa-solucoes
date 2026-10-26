import { authorizeOrderSync } from '../_shared/order-sync-auth.ts'
import { orderSyncOutcome } from '../_shared/order-sync-policy.ts'
import { agendaDoPedido } from '../_shared/exa2-agenda.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EXTERNAL_API_BASE = 'http://18.228.252.149:8000'

const DAY_NAMES_MAP: Record<number, string> = {
  0: 'domingo', 1: 'segunda', 2: 'terca', 3: 'quarta',
  4: 'quinta', 5: 'sexta', 6: 'sabado',
}

function emptyProgramacao() {
  return {
    segunda: [] as Array<{ inicio: string; fim: string }>,
    terca: [] as Array<{ inicio: string; fim: string }>,
    quarta: [] as Array<{ inicio: string; fim: string }>,
    quinta: [] as Array<{ inicio: string; fim: string }>,
    sexta: [] as Array<{ inicio: string; fim: string }>,
    sabado: [] as Array<{ inicio: string; fim: string }>,
    domingo: [] as Array<{ inicio: string; fim: string }>,
  };
}

function trimSeconds(t: string) {
  if (!t) return t;
  const p = t.split(':');
  return p.length >= 2 ? `${p[0]}:${p[1]}` : t;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { pedido_id, action, building_ids } = await req.json()
    const auth = await authorizeOrderSync(req, pedido_id)
    if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const supabase = auth.db

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
        .select('video_id, slot_position, selected_for_display, is_base_video, qr_config, videos(nome, url, duracao, orientacao)')
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

      // Build client_ids: first 4 chars of each building UUID (no hyphens)
      const clientIds = building_ids.map((id: string) => id.replace(/-/g, '').substring(0, 4))
      console.log(`📋 [SYNC-BUILDINGS] client_ids: ${JSON.stringify(clientIds)}`)

      // Download video files from Supabase Storage and build metadata
      const formData = new FormData()
      const metadados: Record<string, any> = {}
      let agendaCache: Awaited<ReturnType<typeof agendaDoPedido>> | null = null

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

          // QR Code rastreável (opcional)
          const qrConfig: any = (pv as any).qr_config;
          const qrFields: any = {};
          if (qrConfig && qrConfig.enabled && qrConfig.redirect_url) {
            qrFields.redirecionamento = qrConfig.redirect_url;
            if (qrConfig.position && typeof qrConfig.position.x === 'number' && typeof qrConfig.position.y === 'number') {
              qrFields.QRLocale = `${qrConfig.position.x},${qrConfig.position.y}`;
            }
            console.log(`🔳 [SYNC-BUILDINGS] QR Code incluído para ${fileNameClean}:`, qrFields);
          }

          // EXA 2.0: programação EFETIVA do pedido (fonte única: _shared/exa2-agenda.ts)
          let programacao: any = emptyProgramacao();
          try {
            if (!agendaCache) agendaCache = await agendaDoPedido(supabase, pedido_id);
            programacao = agendaCache.porVideo.get(pv.video_id) || emptyProgramacao();
            const total = Object.values(programacao).reduce((acc: number, arr: any) => acc + arr.length, 0);
            console.log(`📅 [SYNC-BUILDINGS] ${fileNameClean}: ${total} slot(s) de programação efetiva`);
          } catch (schedErr: any) {
            throw new Error(`Programação indisponível para ${fileNameClean}: ${schedErr.message}`);
          }

          metadados[fileNameClean] = {
            titulo: video.nome || 'Campanha',
            data_ini: dataIni,
            data_fim: dataFim,
            master: pv.is_base_video === true,
            id_pedido: pedido_id,
            isPlus: isVertical,
            programacao,
            ...qrFields
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
        body: formData,
        signal: AbortSignal.timeout(90000)
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

      const outcome = orderSyncOutcome(videos.length, Object.keys(metadados).length, responseData)
      return new Response(JSON.stringify({ 
        success: outcome !== 'error',
        status: outcome,
        expected_videos: videos.length,
        task_ids: responseData.task_ids || (responseData.task_id ? [responseData.task_id] : []),
        error: outcome === 'error' ? 'Reenvio parcial: nem todos os vídeos aprovados foram enviados' : undefined,
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
