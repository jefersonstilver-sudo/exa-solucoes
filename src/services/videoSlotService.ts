
import { supabase } from '@/integrations/supabase/client';
import { VideoSlot } from '@/types/videoManagement';

export const loadVideoSlots = async (orderId: string): Promise<VideoSlot[]> => {
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

    // Buscar campanha avançada associada ao pedido para obter schedule rules
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns_advanced')
      .select('id')
      .eq('pedido_id', orderId)
      .single();

    if (campaignError && campaignError.code !== 'PGRST116') {
      console.error('❌ [VIDEO_SLOTS] Erro ao buscar campanha:', campaignError);
    }

    console.log('📋 [VIDEO_SLOTS] Campanha encontrada:', campaign);

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
        return null;
      }

      // Buscar regras de agendamento se houver campanha
      let scheduleRules = [];
      if (campaign?.id) {
        const { data: videoSchedule, error: scheduleError } = await supabase
          .from('campaign_video_schedules')
          .select(`
            id,
            campaign_schedule_rules (
              id,
              days_of_week,
              start_time,
              end_time,
              is_active
            )
          `)
          .eq('campaign_id', campaign.id)
          .eq('video_id', pv.video_id)
          .eq('slot_position', pv.slot_position);

        if (scheduleError) {
          console.error(`❌ [VIDEO_SLOTS] Erro ao buscar schedule para video ${pv.video_id}:`, scheduleError);
        } else if (videoSchedule && videoSchedule.length > 0) {
          scheduleRules = videoSchedule[0].campaign_schedule_rules || [];
        }
      }

      console.log(`✅ [VIDEO_SLOTS] Video carregado:`, video);
      console.log(`📅 [VIDEO_SLOTS] Schedule rules:`, scheduleRules);
      return { pedidoVideo: pv, video, scheduleRules };
    }) || [];

    const videoResults = await Promise.all(videoPromises);
    const validVideoResults = videoResults.filter(result => result !== null);

    console.log('📋 [VIDEO_SLOTS] Resultados válidos:', validVideoResults);

    // Criar slots 1-4, preenchendo com dados existentes
    const slots: VideoSlot[] = [1, 2, 3, 4].map(position => {
      const matchingResult = validVideoResults.find(result => 
        result && result.pedidoVideo.slot_position === position
      );
      
      if (matchingResult) {
        const { pedidoVideo, video, scheduleRules } = matchingResult;
        console.log(`🎯 [VIDEO_SLOTS] Slot ${position} preenchido com:`, { pedidoVideo, video, scheduleRules });
        
        return {
          id: pedidoVideo.id,
          slot_position: position,
          video_id: pedidoVideo.video_id,
          is_active: pedidoVideo.is_active || false,
          selected_for_display: pedidoVideo.selected_for_display || false,
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
    return [1, 2, 3, 4].map(position => ({
      slot_position: position,
      is_active: false,
      selected_for_display: false,
      approval_status: 'pending' as const
    }));
  }
};
