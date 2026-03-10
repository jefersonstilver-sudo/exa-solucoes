
import { supabase } from '@/integrations/supabase/client';
import { VideoSlot } from '@/types/videoManagement';

export const loadVideoSlots = async (orderId: string, maxSlots: number = 10): Promise<VideoSlot[]> => {
  if (!orderId) return [];

  console.log('🔍 [VIDEO_SLOTS] Carregando slots para pedido:', orderId);

  try {
    // Buscar pedido_videos primeiro
    const { data: pedidoVideos, error: pedidoError } = await supabase
      .from('pedido_videos')
      .select('*')
      .eq('pedido_id', orderId);

    if (pedidoError) {
      console.error('❌ [VIDEO_SLOTS] Erro ao buscar pedido_videos:', pedidoError);
      throw pedidoError;
    }

    console.log('📊 [VIDEO_SLOTS] Pedido_videos encontrados:', pedidoVideos);

    console.log('📋 [VIDEO_SLOTS] Iniciando busca de agendamentos para os vídeos');

    // Buscar vídeos e suas regras de agendamento
    const videoPromises = pedidoVideos?.map(async (pv) => {
      if (!pv.video_id) return null;
      
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', pv.video_id)
        .single();

      if (videoError) {
        console.error(`❌ [VIDEO_SLOTS] Erro ao buscar video ${pv.video_id}:`, videoError);
        // Não retornar null - manter o slot com dados parciais para que apareça como "aguardando"
        console.warn(`⚠️ [VIDEO_SLOTS] Mantendo slot ${pv.slot_position} com dados parciais`);
        return { pedidoVideo: pv, video: null, scheduleRules: [] };
      }

      // Buscar regras de agendamento diretamente por video_id
      console.log(`🔍 [VIDEO_SLOTS] Buscando regras para video ${pv.video_id}`);
      
      const { data: videoSchedules, error: scheduleError } = await supabase
        .from('campaign_video_schedules')
        .select(`
          id,
          campaign_id,
          slot_position,
          campaign_schedule_rules (
            id,
            days_of_week,
            start_time,
            end_time,
            is_active,
            is_all_day
          )
        `)
        .eq('video_id', pv.video_id);

      let scheduleRules = [];
      if (scheduleError) {
        console.error(`❌ [VIDEO_SLOTS] Erro ao buscar schedule para video ${pv.video_id}:`, scheduleError);
      } else if (videoSchedules && videoSchedules.length > 0) {
        // Coletar todas as regras ativas de todos os schedules para este vídeo
        videoSchedules.forEach(schedule => {
          const activeRules = schedule.campaign_schedule_rules?.filter(rule => rule.is_active) || [];
          scheduleRules.push(...activeRules);
        });
        console.log(`📅 [VIDEO_SLOTS] Total de regras ativas encontradas para video ${pv.video_id}:`, scheduleRules.length);
        console.log(`📅 [VIDEO_SLOTS] Regras detalhadas:`, scheduleRules);
      } else {
        console.log(`📭 [VIDEO_SLOTS] Nenhum schedule encontrado para video ${pv.video_id}`);
      }

      console.log(`✅ [VIDEO_SLOTS] Video carregado:`, video);
      console.log(`📅 [VIDEO_SLOTS] Schedule rules:`, scheduleRules);
      return { pedidoVideo: pv, video, scheduleRules };
    }) || [];

    const videoResults = await Promise.all(videoPromises);
    const validVideoResults = videoResults.filter(result => result !== null);

    console.log('📋 [VIDEO_SLOTS] Resultados válidos:', validVideoResults);

    // Criar slots 1-4, preenchendo com dados existentes
    const slots: VideoSlot[] = Array.from({ length: maxSlots }, (_, i) => i + 1).map(position => {
      const matchingResult = validVideoResults.find(result => 
        result && result.pedidoVideo.slot_position === position
      );
      
      if (matchingResult) {
        const { pedidoVideo, video, scheduleRules } = matchingResult;
        console.log(`🎯 [VIDEO_SLOTS] Slot ${position} preenchido com:`, { pedidoVideo, video: video ? 'loaded' : 'null (pending upload)', scheduleRules });
        
        // 🔧 CORREÇÃO: Normalizar dados inconsistentes - vídeos base SEMPRE devem estar ativos e em exibição
        const isBase = pedidoVideo.is_base_video || false;
        const normalizedIsActive = isBase ? true : (pedidoVideo.is_active || false);
        const normalizedSelectedForDisplay = isBase ? true : (pedidoVideo.selected_for_display || false);
        
        // Se video está null (erro ao carregar), retornar slot com dados parciais
        if (!video) {
          console.warn(`⚠️ [VIDEO_SLOTS] Slot ${position} sem dados de vídeo - provavelmente upload recente`);
          return {
            id: pedidoVideo.id,
            slot_position: position,
            video_id: pedidoVideo.video_id,
            is_active: normalizedIsActive,
            selected_for_display: normalizedSelectedForDisplay,
            is_base_video: isBase,
            approval_status: (pedidoVideo.approval_status as 'pending' | 'approved' | 'rejected') || 'pending',
            rejection_reason: pedidoVideo.rejection_reason,
            video_data: undefined, // Será undefined para mostrar como "aguardando"
            schedule_rules: []
          };
        }
        
        if (isBase && (pedidoVideo.is_active !== true || pedidoVideo.selected_for_display !== true)) {
          console.warn('⚠️ [VIDEO_SLOTS] Dados inconsistentes corrigidos no frontend:', {
            slotId: pedidoVideo.id,
            position,
            was_active: pedidoVideo.is_active,
            was_selected: pedidoVideo.selected_for_display,
            now_active: true,
            now_selected: true
          });
        }
        
        return {
          id: pedidoVideo.id,
          slot_position: position,
          video_id: pedidoVideo.video_id,
          is_active: normalizedIsActive,
          selected_for_display: normalizedSelectedForDisplay,
          is_base_video: isBase,
          approval_status: (pedidoVideo.approval_status as 'pending' | 'approved' | 'rejected') || 'pending',
          video_data: {
            id: video.id,
            nome: video.nome,
            url: video.url,
            duracao: video.duracao,
            orientacao: video.orientacao,
            tem_audio: video.tem_audio,
            tamanho_arquivo: video.tamanho_arquivo,
            formato: video.formato
          },
          rejection_reason: pedidoVideo.rejection_reason,
          schedule_rules: scheduleRules
        };
      } else {
        console.log(`📭 [VIDEO_SLOTS] Slot ${position} vazio`);
        return {
          slot_position: position,
          is_active: false,
          selected_for_display: false,
          is_base_video: false,
          approval_status: 'pending' as const
        };
      }
    });

    console.log('🎬 [VIDEO_SLOTS] Slots finais:', slots);
    return slots;

  } catch (error) {
    console.error('💥 [VIDEO_SLOTS] Erro geral:', error);
    
    // FALLBACK: Retornar slots vazios ao invés de falhar completamente
    console.log('🔄 [VIDEO_SLOTS] Usando fallback - slots vazios');
    return Array.from({ length: 10 }, (_, i) => i + 1).map(position => ({
      slot_position: position,
      is_active: false,
      selected_for_display: false,
      is_base_video: false,
      approval_status: 'pending' as const
    }));
  }
};
