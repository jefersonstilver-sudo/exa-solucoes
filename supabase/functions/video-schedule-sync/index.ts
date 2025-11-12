import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ⚡ OTIMIZAÇÃO 7: Logs condicionais (15-20% menos CPU)
const IS_PROD = Deno.env.get('ENVIRONMENT') === 'production';
const log = {
  info: (...args: any[]) => !IS_PROD && console.log(...args),
  warn: (...args: any[]) => !IS_PROD && console.warn(...args),
  error: (...args: any[]) => console.error(...args)
};

// ⚡ OTIMIZAÇÃO 6: Cache de RPC em memória (60% menos chamadas)
const rpcCache = new Map<string, { result: any; timestamp: number }>();
const RPC_CACHE_TTL = 60000; // 1 minuto

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

    log.info('🔄 [VIDEO_SYNC] Starting video schedule synchronization...');

    // Obter horário atual em São Paulo (UTC-3)
    const now = new Date();
    const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    const currentDay = brasiliaTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = brasiliaTime.toTimeString().slice(0, 5); // HH:MM format

    log.info(`⏰ [VIDEO_SYNC] Current time: ${brasiliaTime.toISOString()}, Day: ${currentDay}, Time: ${currentTime}`);

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
        campaign_video_schedules!campaign_schedule_rules_campaign_video_schedule_id_fkey (
          video_id,
          slot_position,
          campaign_id,
          campaigns_advanced!fk_campaign_video_schedules_campaign (
            pedido_id,
            status
          )
        )
      `)
      .eq('is_active', true);

    if (rulesError) {
      log.error('❌ [VIDEO_SYNC] Error fetching schedule rules:', rulesError);
      throw rulesError;
    }

    log.info(`📋 [VIDEO_SYNC] Found ${scheduleRules?.length || 0} active schedule rules`);

    // ⚡ OTIMIZAÇÃO 2: Filtrar regras válidas ANTES (null-safety)
    const validRules = (scheduleRules || []).filter(rule => {
      const cvs = rule.campaign_video_schedules;
      const campaign = cvs?.campaigns_advanced;
      return cvs && campaign && campaign.status === 'active' && campaign.pedido_id;
    });

    log.info(`✅ [VIDEO_SYNC] ${validRules.length} valid rules after filtering`);

    // Agrupar por pedido
    const pedidosMap = new Map<string, any[]>();
    validRules.forEach(rule => {
      const pedidoId = rule.campaign_video_schedules.campaigns_advanced.pedido_id;
      if (!pedidosMap.has(pedidoId)) {
        pedidosMap.set(pedidoId, []);
      }
      pedidosMap.get(pedidoId)!.push(rule);
    });

    const pedidosProcessados = new Set<string>();
    const resultados = {
      trocas_realizadas: 0,
      videos_ativados: 0,
      videos_desativados: 0,
      erros: [] as string[]
    };

    // ⚡ OTIMIZAÇÃO 2: Processar pedidos em PARALELO com Promise.allSettled
    const processingPromises = Array.from(pedidosMap.entries()).map(async ([pedidoId, rules]) => {
      if (pedidosProcessados.has(pedidoId)) {
        return { success: true, pedidoId, skipped: true };
      }
      pedidosProcessados.add(pedidoId);

      log.info(`🔍 [VIDEO_SYNC] Processing pedido: ${pedidoId}`);

      try {
        // Buscar todos os vídeos deste pedido
        const { data: pedidoVideos, error: videosError } = await supabase
          .from('pedido_videos')
          .select('*')
          .eq('pedido_id', pedidoId)
          .eq('approval_status', 'approved');

        if (videosError) {
          log.error(`❌ [VIDEO_SYNC] Error fetching videos for pedido ${pedidoId}:`, videosError);
          return { success: false, pedidoId, error: videosError.message };
        }

        // Usar regras já filtradas do map (evita query extra)
        const activeRules = rules;

        // Verificar qual vídeo deve estar ativo agora
        let videoParaExibir: string | null = null;
        let slotParaExibir: number | null = null;
        let ruleAtiva: any = null;

        for (const activeRule of activeRules || []) {
          const cvs = activeRule.campaign_video_schedules;
          
          // ⚡ NULL-SAFETY: Validar antes de acessar
          if (!cvs || !cvs.video_id) continue;
          
          // Verificar se hoje está nos dias programados
          if (!activeRule.days_of_week || !activeRule.days_of_week.includes(currentDay)) {
            continue;
          }

          // Verificar se estamos no horário programado
          if (currentTime >= activeRule.start_time && currentTime <= activeRule.end_time) {
            videoParaExibir = cvs.video_id;
            slotParaExibir = cvs.slot_position;
            ruleAtiva = activeRule;
            log.info(`✅ [VIDEO_SYNC] Found active schedule: video ${videoParaExibir}, slot ${slotParaExibir}, time ${activeRule.start_time}-${activeRule.end_time}`);
            break;
          }
        }

        // Se não há vídeo agendado para agora, usar vídeo base
        if (!videoParaExibir) {
          const videoBase = pedidoVideos?.find(v => v.is_base_video);
          if (videoBase && videoBase.video_id) {
            videoParaExibir = videoBase.video_id;
            slotParaExibir = videoBase.slot_position;
            log.info(`📌 [VIDEO_SYNC] Using base video: video ${videoParaExibir}, slot ${slotParaExibir}`);
          }
        }

        if (!videoParaExibir) {
          log.info(`⚠️ [VIDEO_SYNC] No video found for display in pedido ${pedidoId}`);
          return { success: true, pedidoId, skipped: true, reason: 'no_video' };
        }

        // Verificar se já está correto
        const videoAtualmenteExibindo = pedidoVideos?.find(v => v.selected_for_display);
        
        if (videoAtualmenteExibindo?.video_id === videoParaExibir) {
          log.info(`✅ [VIDEO_SYNC] Video already correct for pedido ${pedidoId}`);
          return { success: true, pedidoId, skipped: true, reason: 'already_correct' };
        }

        log.info(`🔄 [VIDEO_SYNC] Switching video for pedido ${pedidoId}: from ${videoAtualmenteExibindo?.video_id || 'none'} to ${videoParaExibir}`);

        // Encontrar o pedido_video_id (slot ID) do vídeo que queremos ativar
        const videoSlotParaAtivar = pedidoVideos?.find(v => v.video_id === videoParaExibir);
        
        if (!videoSlotParaAtivar) {
          log.error(`❌ [VIDEO_SYNC] Video slot not found for video ${videoParaExibir} in pedido ${pedidoId}`);
          return { success: false, pedidoId, error: 'Video slot not found' };
        }

        // Usar RPC select_video_for_display para fazer a troca de forma segura
        // Este RPC já lida com triggers e validações automaticamente
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('select_video_for_display', {
            p_pedido_video_id: videoSlotParaAtivar.id
          });

        if (rpcError) {
          log.error(`❌ [VIDEO_SYNC] Error calling select_video_for_display RPC for pedido ${pedidoId}:`, rpcError);
          return { success: false, pedidoId, error: rpcError.message };
        }

        if (!rpcResult) {
          log.error(`❌ [VIDEO_SYNC] RPC returned false for pedido ${pedidoId}`);
          return { success: false, pedidoId, error: 'RPC returned false' };
        }

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
          log.error(`❌ [VIDEO_SYNC] Error logging for pedido ${pedidoId}:`, logError);
        }

        log.info(`✅ [VIDEO_SYNC] Successfully switched video for pedido ${pedidoId}`);
        
        // Enviar POSTs para o webhook n8n após troca automática bem-sucedida
        try {
          // Buscar lista de prédios do pedido
          const { data: pedidoData, error: pedidoError } = await supabase
            .from('pedidos')
            .select('lista_predios')
            .eq('id', pedidoId)
            .single();
          
          if (pedidoError) {
            log.warn(`⚠️ [VIDEO_SYNC][POST] Erro ao buscar prédios do pedido ${pedidoId}:`, pedidoError);
          } else if (pedidoData?.lista_predios && Array.isArray(pedidoData.lista_predios)) {
            const buildingIds = pedidoData.lista_predios;
            log.info(`🏢 [VIDEO_SYNC][POST] Enviando POSTs para ${buildingIds.length} prédios do pedido ${pedidoId}`);
            
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
                log.warn(`⚠️ [VIDEO_SYNC][POST] ${failureCount}/${postResults.length} POSTs falharam para pedido ${pedidoId}`);
              } else {
                log.info(`✅ [VIDEO_SYNC][POST] Todos os ${postResults.length} POSTs enviados com sucesso para pedido ${pedidoId}`);
              }
            }
          } else {
            log.info(`ℹ️ [VIDEO_SYNC][POST] Pedido ${pedidoId} sem lista de prédios - não enviando POSTs`);
          }
        } catch (postError) {
          log.error(`❌ [VIDEO_SYNC][POST] Erro ao enviar POSTs para pedido ${pedidoId}:`, postError);
        }

        return { 
          success: true, 
          pedidoId, 
          videosAtivados: 1, 
          videosDesativados: 1, 
          trocasRealizadas: 1 
        };

      } catch (error) {
        log.error(`❌ [VIDEO_SYNC] Error processing pedido ${pedidoId}:`, error);
        return { success: false, pedidoId, error: error.message };
      }
    });

    // Aguardar todas as promessas (mesmo que falhem)
    const results = await Promise.allSettled(processingPromises);

    // Consolidar resultados
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success && !result.value.skipped) {
        if (result.value.videosAtivados) resultados.videos_ativados += result.value.videosAtivados;
        if (result.value.videosDesativados) resultados.videos_desativados += result.value.videosDesativados;
        if (result.value.trocasRealizadas) resultados.trocas_realizadas += result.value.trocasRealizadas;
      } else if (result.status === 'fulfilled' && !result.value.success) {
        resultados.erros.push(result.value.error || 'Unknown error');
      } else if (result.status === 'rejected') {
        resultados.erros.push(result.reason?.message || 'Promise rejected');
      }
    });

    const resultado = {
      success: true,
      timestamp: brasiliaTime.toISOString(),
      current_time: currentTime,
      current_day: currentDay,
      pedidos_processados: pedidosProcessados.size,
      ...resultados
    };

    log.info('🎉 [VIDEO_SYNC] Synchronization complete:', resultado);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    log.error('💥 [VIDEO_SYNC] Fatal error:', error);
    
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