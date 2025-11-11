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

    const videosToActivate: string[] = [];
    const videosToDeactivate: string[] = [];

    // Processar cada regra
    for (const rule of scheduleRules || []) {
      const schedule = rule.campaign_video_schedules;
      const campaign = schedule.campaigns_advanced;
      
      // Verificar se hoje está nos dias programados
      const isDayActive = rule.days_of_week.includes(currentDay);
      
      // Verificar se está no horário
      const isTimeActive = isDayActive && 
        currentTimeStr >= rule.start_time && 
        currentTimeStr <= rule.end_time;

      console.log(`🎯 [VIDEO_STATUS] Vídeo ${schedule.video_id} (Pedido: ${campaign.pedido_id}): Dia ativo: ${isDayActive}, Horário ativo: ${isTimeActive}`);

      if (isTimeActive) {
        videosToActivate.push(schedule.video_id);
      } else {
        videosToDeactivate.push(schedule.video_id);
      }
    }

    let activatedCount = 0;
    let deactivatedCount = 0;
    const affectedPedidos = new Set<string>();

    // Ativar vídeos que estão no horário
    for (const videoId of videosToActivate) {
      const rule = scheduleRules?.find((r: any) => r.campaign_video_schedules.video_id === videoId);
      if (!rule) continue;

      const pedidoId = rule.campaign_video_schedules.campaigns_advanced.pedido_id;
      affectedPedidos.add(pedidoId);

      // 1. Ativar vídeo agendado e marcar para exibição
      const { error: activateError } = await supabase
        .from('pedido_videos')
        .update({ 
          is_active: true,
          selected_for_display: true,
          updated_at: new Date().toISOString()
        })
        .eq('video_id', videoId)
        .eq('approval_status', 'approved');

      if (activateError) {
        console.error(`❌ Erro ao ativar vídeo ${videoId}:`, activateError);
        continue;
      }

      // 2. Desmarcar selected_for_display dos outros vídeos do mesmo pedido
      const { error: deselectError } = await supabase
        .from('pedido_videos')
        .update({ 
          selected_for_display: false,
          updated_at: new Date().toISOString()
        })
        .eq('pedido_id', pedidoId)
        .neq('video_id', videoId);

      if (deselectError) {
        console.error(`❌ Erro ao desmarcar outros vídeos do pedido ${pedidoId}:`, deselectError);
      } else {
        activatedCount++;
        console.log(`✅ [VIDEO_STATUS] Vídeo ${videoId} ativado e marcado para exibição (Pedido: ${pedidoId})`);
      }
    }

    // Desativar vídeos que saíram do horário (apenas os agendados)
    for (const videoId of videosToDeactivate) {
      const rule = scheduleRules?.find((r: any) => r.campaign_video_schedules.video_id === videoId);
      if (!rule) continue;

      const pedidoId = rule.campaign_video_schedules.campaigns_advanced.pedido_id;
      affectedPedidos.add(pedidoId);

      // 1. Desativar vídeo agendado e desmarcar exibição
      const { error: deactivateError } = await supabase
        .from('pedido_videos')
        .update({ 
          is_active: false,
          selected_for_display: false,
          updated_at: new Date().toISOString()
        })
        .eq('video_id', videoId)
        .eq('approval_status', 'approved')
        .eq('is_base_video', false);

      if (deactivateError) {
        console.error(`❌ Erro ao desativar vídeo ${videoId}:`, deactivateError);
        continue;
      }

      // 2. Reativar vídeo base do pedido
      const { error: reactivateBaseError } = await supabase
        .from('pedido_videos')
        .update({ 
          selected_for_display: true,
          updated_at: new Date().toISOString()
        })
        .eq('pedido_id', pedidoId)
        .eq('is_base_video', true)
        .eq('approval_status', 'approved')
        .limit(1);

      if (reactivateBaseError) {
        console.error(`❌ Erro ao reativar vídeo base do pedido ${pedidoId}:`, reactivateBaseError);
      } else {
        deactivatedCount++;
        console.log(`⏹️ [VIDEO_STATUS] Vídeo ${videoId} desativado, vídeo base reativado (Pedido: ${pedidoId})`);
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