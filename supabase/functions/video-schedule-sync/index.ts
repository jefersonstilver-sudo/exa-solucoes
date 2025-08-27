import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScheduleRule {
  id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  campaign_video_schedule_id: string;
  video_id: string;
  slot_position: number;
  pedido_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 [VIDEO_SYNC] Starting video schedule synchronization...');

    // Obter horário atual em São Paulo (UTC-3)
    const now = new Date();
    const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const currentDay = brasiliaTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = brasiliaTime.toTimeString().slice(0, 5); // HH:MM format

    console.log(`⏰ [VIDEO_SYNC] Current time: ${brasiliaTime.toISOString()}, Day: ${currentDay}, Time: ${currentTime}`);

    // Buscar todas as regras de agendamento ativas
    const { data: scheduleRules, error: rulesError } = await supabase
      .from('campaign_schedule_rules')
      .select(`
        id,
        days_of_week,
        start_time,
        end_time,
        is_active,
        campaign_video_schedule_id,
        campaign_video_schedules (
          video_id,
          slot_position,
          campaign_id,
          campaigns_advanced (
            pedido_id,
            status
          )
        )
      `)
      .eq('is_active', true);

    if (rulesError) {
      console.error('❌ [VIDEO_SYNC] Error fetching schedule rules:', rulesError);
      throw rulesError;
    }

    console.log(`📋 [VIDEO_SYNC] Found ${scheduleRules?.length || 0} active schedule rules`);

    // Processar cada pedido separadamente
    const pedidosProcessados = new Set<string>();
    const resultados = {
      trocas_realizadas: 0,
      videos_ativados: 0,
      videos_desativados: 0,
      erros: [] as string[]
    };

    for (const rule of scheduleRules || []) {
      const cvs = rule.campaign_video_schedules;
      const campaign = cvs?.campaigns_advanced;
      
      if (!cvs || !campaign || campaign.status !== 'active') {
        continue;
      }

      const pedidoId = campaign.pedido_id;
      
      // Processar cada pedido apenas uma vez
      if (pedidosProcessados.has(pedidoId)) {
        continue;
      }
      pedidosProcessados.add(pedidoId);

      console.log(`🔍 [VIDEO_SYNC] Processing pedido: ${pedidoId}`);

      try {
        // Buscar todos os vídeos deste pedido
        const { data: pedidoVideos, error: videosError } = await supabase
          .from('pedido_videos')
          .select('*')
          .eq('pedido_id', pedidoId)
          .eq('approval_status', 'approved');

        if (videosError) {
          console.error(`❌ [VIDEO_SYNC] Error fetching videos for pedido ${pedidoId}:`, videosError);
          resultados.erros.push(`Error fetching videos for pedido ${pedidoId}: ${videosError.message}`);
          continue;
        }

        // Buscar regras ativas para este pedido
        const { data: activeRules, error: activeRulesError } = await supabase
          .from('campaign_schedule_rules')
          .select(`
            *,
            campaign_video_schedules (
              video_id,
              slot_position,
              campaigns_advanced!inner (
                pedido_id
              )
            )
          `)
          .eq('is_active', true)
          .eq('campaign_video_schedules.campaigns_advanced.pedido_id', pedidoId);

        if (activeRulesError) {
          console.error(`❌ [VIDEO_SYNC] Error fetching active rules for pedido ${pedidoId}:`, activeRulesError);
          continue;
        }

        // Verificar qual vídeo deve estar ativo agora
        let videoParaExibir: string | null = null;
        let slotParaExibir: number | null = null;
        let ruleAtiva: any = null;

        for (const activeRule of activeRules || []) {
          const cvs = activeRule.campaign_video_schedules;
          
          // Verificar se hoje está nos dias programados
          if (!activeRule.days_of_week.includes(currentDay)) {
            continue;
          }

          // Verificar se estamos no horário programado
          if (currentTime >= activeRule.start_time && currentTime <= activeRule.end_time) {
            videoParaExibir = cvs.video_id;
            slotParaExibir = cvs.slot_position;
            ruleAtiva = activeRule;
            console.log(`✅ [VIDEO_SYNC] Found active schedule: video ${videoParaExibir}, slot ${slotParaExibir}, time ${activeRule.start_time}-${activeRule.end_time}`);
            break;
          }
        }

        // Se não há vídeo agendado para agora, usar vídeo base
        if (!videoParaExibir) {
          const videoBase = pedidoVideos?.find(v => v.is_base_video);
          if (videoBase) {
            videoParaExibir = videoBase.video_id;
            slotParaExibir = videoBase.slot_position;
            console.log(`📌 [VIDEO_SYNC] Using base video: video ${videoParaExibir}, slot ${slotParaExibir}`);
          }
        }

        if (!videoParaExibir) {
          console.log(`⚠️ [VIDEO_SYNC] No video found for display in pedido ${pedidoId}`);
          continue;
        }

        // Verificar se já está correto
        const videoAtualmenteExibindo = pedidoVideos?.find(v => v.selected_for_display);
        
        if (videoAtualmenteExibindo?.video_id === videoParaExibir) {
          console.log(`✅ [VIDEO_SYNC] Video already correct for pedido ${pedidoId}`);
          continue;
        }

        console.log(`🔄 [VIDEO_SYNC] Switching video for pedido ${pedidoId}: from ${videoAtualmenteExibindo?.video_id || 'none'} to ${videoParaExibir}`);

        // Desativar todos os vídeos selecionados
        const { error: desativarError } = await supabase
          .from('pedido_videos')
          .update({ selected_for_display: false, updated_at: new Date().toISOString() })
          .eq('pedido_id', pedidoId)
          .eq('selected_for_display', true);

        if (desativarError) {
          console.error(`❌ [VIDEO_SYNC] Error deactivating videos for pedido ${pedidoId}:`, desativarError);
          resultados.erros.push(`Error deactivating videos for pedido ${pedidoId}: ${desativarError.message}`);
          continue;
        }

        resultados.videos_desativados++;

        // Ativar o vídeo correto
        const { error: ativarError } = await supabase
          .from('pedido_videos')
          .update({ selected_for_display: true, updated_at: new Date().toISOString() })
          .eq('pedido_id', pedidoId)
          .eq('video_id', videoParaExibir);

        if (ativarError) {
          console.error(`❌ [VIDEO_SYNC] Error activating video ${videoParaExibir} for pedido ${pedidoId}:`, ativarError);
          resultados.erros.push(`Error activating video ${videoParaExibir} for pedido ${pedidoId}: ${ativarError.message}`);
          continue;
        }

        resultados.videos_ativados++;

        // Registrar no log
        const logDetails = {
          sync_time: brasiliaTime.toISOString(),
          current_day: currentDay,
          current_time: currentTime,
          previous_video: videoAtualmenteExibindo?.video_id || null,
          new_video: videoParaExibir,
          reason: ruleAtiva ? 'scheduled' : 'base_video',
          rule_id: ruleAtiva?.id || null,
          schedule_time: ruleAtiva ? `${ruleAtiva.start_time}-${ruleAtiva.end_time}` : null
        };

        const { error: logError } = await supabase
          .from('video_management_logs')
          .insert({
            pedido_id: pedidoId,
            action_type: 'automatic_video_sync',
            slot_from: videoAtualmenteExibindo?.slot_position || null,
            slot_to: slotParaExibir,
            video_from_id: videoAtualmenteExibindo?.video_id || null,
            video_to_id: videoParaExibir,
            details: logDetails
          });

        if (logError) {
          console.error(`❌ [VIDEO_SYNC] Error logging for pedido ${pedidoId}:`, logError);
        }

        resultados.trocas_realizadas++;
        console.log(`✅ [VIDEO_SYNC] Successfully switched video for pedido ${pedidoId}`);
        
        // Enviar POSTs para o webhook n8n após troca automática bem-sucedida
        try {
          // Buscar lista de prédios do pedido
          const { data: pedidoData, error: pedidoError } = await supabase
            .from('pedidos')
            .select('lista_predios')
            .eq('id', pedidoId)
            .single();
          
          if (pedidoError) {
            console.warn(`⚠️ [VIDEO_SYNC][POST] Erro ao buscar prédios do pedido ${pedidoId}:`, pedidoError);
          } else if (pedidoData?.lista_predios && Array.isArray(pedidoData.lista_predios)) {
            const buildingIds = pedidoData.lista_predios;
            console.log(`🏢 [VIDEO_SYNC][POST] Enviando POSTs para ${buildingIds.length} prédios do pedido ${pedidoId}`);
            
            // Buscar títulos dos vídeos para os POSTs
            const oldVideoTitle = videoAtualmenteExibindo?.title || null;
            const newVideoData = pedidoVideos?.find(v => v.video_id === videoParaExibir);
            const newVideoTitle = newVideoData?.title || null;
            
            // Enviar POSTs para cada prédio
            const postPromises: Promise<Response>[] = [];
            
            // POST de desativação para vídeo anterior (se houver)
            if (oldVideoTitle) {
              buildingIds.forEach((buildingId: string) => {
                postPromises.push(
                  fetch('https://stilver.app.n8n.cloud/webhook/ATIVAR/DESATIVAR', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      titulo: oldVideoTitle,
                      ativo: false,
                      predio_id: buildingId
                    })
                  })
                );
              });
            }
            
            // POST de ativação para novo vídeo
            if (newVideoTitle) {
              buildingIds.forEach((buildingId: string) => {
                postPromises.push(
                  fetch('https://stilver.app.n8n.cloud/webhook/ATIVAR/DESATIVAR', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      titulo: newVideoTitle,
                      ativo: true,
                      predio_id: buildingId
                    })
                  })
                );
              });
            }
            
            // Executar todos os POSTs
            if (postPromises.length > 0) {
              const postResults = await Promise.allSettled(postPromises);
              const successCount = postResults.filter(r => r.status === 'fulfilled' && r.value.ok).length;
              const failureCount = postResults.length - successCount;
              
              if (failureCount > 0) {
                console.warn(`⚠️ [VIDEO_SYNC][POST] ${failureCount}/${postResults.length} POSTs falharam para pedido ${pedidoId}`);
              } else {
                console.log(`✅ [VIDEO_SYNC][POST] Todos os ${postResults.length} POSTs enviados com sucesso para pedido ${pedidoId}`);
              }
            }
          } else {
            console.log(`ℹ️ [VIDEO_SYNC][POST] Pedido ${pedidoId} sem lista de prédios - não enviando POSTs`);
          }
        } catch (postError) {
          console.error(`❌ [VIDEO_SYNC][POST] Erro ao enviar POSTs para pedido ${pedidoId}:`, postError);
        }

      } catch (error) {
        console.error(`❌ [VIDEO_SYNC] Error processing pedido ${pedidoId}:`, error);
        resultados.erros.push(`Error processing pedido ${pedidoId}: ${error.message}`);
      }
    }

    const resultado = {
      success: true,
      timestamp: brasiliaTime.toISOString(),
      current_time: currentTime,
      current_day: currentDay,
      pedidos_processados: pedidosProcessados.size,
      ...resultados
    };

    console.log('🎉 [VIDEO_SYNC] Synchronization complete:', resultado);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('💥 [VIDEO_SYNC] Fatal error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});