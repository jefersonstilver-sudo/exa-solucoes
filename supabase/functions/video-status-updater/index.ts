import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleRule {
  id: string;
  campaign_video_schedule_id: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  video_id: string;
  pedido_id: string;
  slot_position: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter horário atual de Brasília
    const brasiliaTime = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
    const currentTime = new Date(brasiliaTime);
    const currentDay = currentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTimeStr = currentTime.toTimeString().slice(0, 8); // HH:MM:SS

    console.log(`🕐 [VIDEO_STATUS] Verificando status dos vídeos - Brasília: ${currentTime}, Dia: ${currentDay}, Hora: ${currentTimeStr}`);

    // Buscar todas as regras de agendamento ativas
    const { data: scheduleRules, error: rulesError } = await supabase
      .from('campaign_schedule_rules')
      .select(`
        id,
        campaign_video_schedule_id,
        days_of_week,
        start_time,
        end_time,
        is_active,
        campaign_video_schedules!inner (
          video_id,
          campaign_id,
          slot_position,
          campaigns_advanced!inner (
            pedido_id,
            status
          )
        )
      `)
      .eq('is_active', true)
      .eq('campaign_video_schedules.campaigns_advanced.status', 'active');

    if (rulesError) {
      console.error('❌ Erro ao buscar regras:', rulesError);
      throw rulesError;
    }

    console.log(`📋 [VIDEO_STATUS] Encontradas ${scheduleRules?.length || 0} regras ativas`);

    // Map para rastrear vídeos e suas regras ativas
    const videoStatusMap = new Map<string, { pedidoId: string, hasActiveRule: boolean }>();

    // Processar cada regra para determinar quais vídeos têm regras ativas
    for (const rule of scheduleRules || []) {
      const schedule = rule.campaign_video_schedules;
      const campaign = schedule.campaigns_advanced;
      const videoId = schedule.video_id;
      
      // Verificar se hoje está nos dias programados
      const isDayActive = rule.days_of_week.includes(currentDay);
      
      // Verificar se está no horário
      const isTimeActive = isDayActive && 
        currentTimeStr >= rule.start_time && 
        currentTimeStr <= rule.end_time;

      console.log(`🎯 [VIDEO_STATUS] Vídeo ${videoId} (Pedido: ${campaign.pedido_id}): Regra ${rule.id.slice(0,8)}, Dia ativo: ${isDayActive}, Horário ativo: ${isTimeActive}`);

      // Se este vídeo ainda não foi processado, inicializar
      if (!videoStatusMap.has(videoId)) {
        videoStatusMap.set(videoId, { 
          pedidoId: campaign.pedido_id, 
          hasActiveRule: false 
        });
      }

      // Se QUALQUER regra está ativa, marcar o vídeo como tendo regra ativa
      if (isTimeActive) {
        const status = videoStatusMap.get(videoId)!;
        status.hasActiveRule = true;
        videoStatusMap.set(videoId, status);
      }
    }

    // Separar vídeos em listas de ativação/desativação com base no status final
    const videosToActivate: string[] = [];
    const videosToDeactivate: string[] = [];

    for (const [videoId, status] of videoStatusMap.entries()) {
      if (status.hasActiveRule) {
        videosToActivate.push(videoId);
      } else {
        videosToDeactivate.push(videoId);
      }
    }

    let activatedCount = 0;
    let deactivatedCount = 0;
    const affectedPedidos = new Set<string>();

    // ✅ ATIVAR VÍDEOS AGENDADOS (sem desativar base - triggers do banco não permitem)
    for (const videoId of videosToActivate) {
      const rule = scheduleRules?.find((r: any) => r.campaign_video_schedules.video_id === videoId);
      if (!rule) continue;

      const pedidoId = rule.campaign_video_schedules.campaigns_advanced.pedido_id;
      affectedPedidos.add(pedidoId);

      console.log(`🎬 [VIDEO_STATUS] Ativando vídeo agendado ${videoId} (Pedido: ${pedidoId})`);

      // 1. Usar RPC select_video_for_display que gerencia tudo corretamente
      // Primeiro, buscar o pedido_video_id do vídeo agendado
      const { data: pedidoVideo, error: fetchError } = await supabase
        .from('pedido_videos')
        .select('id')
        .eq('video_id', videoId)
        .eq('pedido_id', pedidoId)
        .eq('approval_status', 'approved')
        .eq('is_base_video', false)
        .single();

      if (fetchError || !pedidoVideo) {
        console.error(`❌ Erro ao buscar pedido_video:`, fetchError);
        continue;
      }

      // 2. Chamar RPC que faz toda a lógica corretamente
      const { error: rpcError } = await supabase
        .rpc('select_video_for_display', {
          p_pedido_video_id: pedidoVideo.id
        });

      if (rpcError) {
        console.error(`❌ Erro ao ativar vídeo agendado ${videoId}:`, rpcError);
        continue;
      }

      activatedCount++;
      console.log(`✅ [VIDEO_STATUS] Vídeo agendado ${videoId} ativado para exibição (Pedido: ${pedidoId})`);
      
      // 🔔 SINCRONIZAR COM AWS IMEDIATAMENTE
      console.log(`🔔 [VIDEO_STATUS] Sincronizando com AWS: pedido ${pedidoId}, vídeo ${videoId}`);
      try {
        const { data: awsResult, error: awsError } = await supabase.functions.invoke(
          'sync-video-status-to-aws',
          {
            body: { 
              pedidoId,
              activeVideoId: videoId
            }
          }
        );

        if (awsError) {
          console.error(`❌ [VIDEO_STATUS] Erro ao sincronizar com AWS:`, awsError);
        } else {
          console.log(`✅ [VIDEO_STATUS] AWS sincronizada:`, awsResult);
        }
      } catch (awsCallError) {
        console.error(`❌ [VIDEO_STATUS] Erro ao chamar sync-video-status-to-aws:`, awsCallError);
      }
    }

    // ⏹️ DESATIVAR VÍDEOS AGENDADOS E REATIVAR VÍDEO BASE
    for (const videoId of videosToDeactivate) {
      const rule = scheduleRules?.find((r: any) => r.campaign_video_schedules.video_id === videoId);
      if (!rule) continue;

      const pedidoId = rule.campaign_video_schedules.campaigns_advanced.pedido_id;
      affectedPedidos.add(pedidoId);

      console.log(`⏹️ [VIDEO_STATUS] Desativando vídeo agendado ${videoId} (Pedido: ${pedidoId})`);

      // 1. Buscar o vídeo base para reativar
      const { data: baseVideo, error: baseError } = await supabase
        .from('pedido_videos')
        .select('id')
        .eq('pedido_id', pedidoId)
        .eq('is_base_video', true)
        .eq('approval_status', 'approved')
        .single();

      if (baseError || !baseVideo) {
        console.error(`❌ Erro ao buscar vídeo base:`, baseError);
        continue;
      }

      // 2. Usar RPC para reativar vídeo base (gerencia tudo corretamente)
      const { error: rpcError } = await supabase
        .rpc('select_video_for_display', {
          p_pedido_video_id: baseVideo.id
        });

      if (rpcError) {
        console.error(`❌ Erro ao reativar vídeo base:`, rpcError);
      } else {
        deactivatedCount++;
        console.log(`✅ [VIDEO_STATUS] Vídeo base reativado para pedido ${pedidoId}`);
        
        // 🔔 SINCRONIZAR COM AWS ao reativar vídeo base
        console.log(`🔔 [VIDEO_STATUS] Sincronizando com AWS após reativar base: pedido ${pedidoId}`);
        try {
          const { data: awsResult, error: awsError } = await supabase.functions.invoke(
            'sync-video-status-to-aws',
            {
              body: { 
                pedidoId,
                activeVideoId: null // Will determine from database
              }
            }
          );

          if (awsError) {
            console.error(`❌ [VIDEO_STATUS] Erro ao sincronizar com AWS:`, awsError);
          } else {
            console.log(`✅ [VIDEO_STATUS] AWS sincronizada após base:`, awsResult);
          }
        } catch (awsCallError) {
          console.error(`❌ [VIDEO_STATUS] Erro ao chamar sync-video-status-to-aws:`, awsCallError);
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      brasilia_time: currentTime.toISOString(),
      current_day: currentDay,
      current_time: currentTimeStr,
      rules_processed: scheduleRules?.length || 0,
      videos_activated: activatedCount,
      videos_deactivated: deactivatedCount,
      activated_videos: videosToActivate,
      deactivated_videos: videosToDeactivate
    };

    console.log(`🎉 [VIDEO_STATUS] Processamento concluído:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('💥 [VIDEO_STATUS] Erro geral:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});