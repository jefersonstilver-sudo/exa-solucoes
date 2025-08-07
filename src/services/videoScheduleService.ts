import { supabase } from '@/integrations/supabase/client';

interface ScheduleRule {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export const videoScheduleService = {
  /**
   * Verifica se um vídeo deve estar ativo no momento atual
   */
  async isVideoActiveNow(videoId: string): Promise<boolean> {
    try {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      console.log('🕐 [SCHEDULE] Verificando horário atual:', {
        videoId,
        currentDay,
        currentTime,
        dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentDay]
      });

      // Buscar regras de agendamento para o vídeo
      const { data: scheduleRules, error } = await supabase
        .from('campaign_schedule_rules')
        .select(`
          days_of_week,
          start_time,
          end_time,
          is_active,
          campaign_video_schedules!inner (
            video_id
          )
        `)
        .eq('campaign_video_schedules.video_id', videoId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ [SCHEDULE] Erro ao buscar regras:', error);
        return false;
      }

      if (!scheduleRules || scheduleRules.length === 0) {
        console.log('📋 [SCHEDULE] Nenhuma regra encontrada para o vídeo');
        return false;
      }

      // Verificar se alguma regra está ativa no momento atual
      for (const rule of scheduleRules) {
        const { days_of_week, start_time, end_time } = rule;

        // Verificar se hoje é um dos dias programados
        if (days_of_week.includes(currentDay)) {
          // Verificar se está dentro do horário
          if (currentTime >= start_time && currentTime <= end_time) {
            console.log('✅ [SCHEDULE] Vídeo deve estar ativo:', {
              rule: { days_of_week, start_time, end_time },
              matched: true
            });
            return true;
          }
        }
      }

      console.log('❌ [SCHEDULE] Vídeo não deve estar ativo no momento');
      return false;

    } catch (error) {
      console.error('❌ [SCHEDULE] Erro inesperado:', error);
      return false;
    }
  },

  /**
   * Atualiza o status selected_for_display de um vídeo baseado no agendamento
   */
  async updateVideoSelectionStatus(pedidoVideoId: string, videoId: string): Promise<boolean> {
    try {
      const shouldBeActive = await this.isVideoActiveNow(videoId);
      
      console.log('🔄 [SCHEDULE] Atualizando status do vídeo:', {
        pedidoVideoId,
        videoId,
        shouldBeActive
      });

      const { error } = await supabase
        .from('pedido_videos')
        .update({ 
          selected_for_display: shouldBeActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoVideoId)
        .eq('approval_status', 'approved'); // Só atualizar vídeos aprovados

      if (error) {
        console.error('❌ [SCHEDULE] Erro ao atualizar status:', error);
        return false;
      }

      console.log('✅ [SCHEDULE] Status atualizado com sucesso');
      return true;

    } catch (error) {
      console.error('❌ [SCHEDULE] Erro inesperado na atualização:', error);
      return false;
    }
  },

  /**
   * Atualiza todos os vídeos de um pedido baseado nos agendamentos
   */
  async updateAllVideosForOrder(orderId: string): Promise<void> {
    try {
      console.log('🔄 [SCHEDULE] Atualizando todos os vídeos do pedido:', orderId);

      // Buscar todos os vídeos aprovados do pedido
      const { data: pedidoVideos, error } = await supabase
        .from('pedido_videos')
        .select('id, video_id')
        .eq('pedido_id', orderId)
        .eq('approval_status', 'approved');

      if (error) {
        console.error('❌ [SCHEDULE] Erro ao buscar vídeos do pedido:', error);
        return;
      }

      if (!pedidoVideos || pedidoVideos.length === 0) {
        console.log('📋 [SCHEDULE] Nenhum vídeo aprovado encontrado');
        return;
      }

      // Atualizar cada vídeo
      const updatePromises = pedidoVideos.map(video => 
        this.updateVideoSelectionStatus(video.id, video.video_id)
      );

      await Promise.all(updatePromises);
      console.log('✅ [SCHEDULE] Todos os vídeos foram atualizados');

    } catch (error) {
      console.error('❌ [SCHEDULE] Erro ao atualizar vídeos do pedido:', error);
    }
  },

  /**
   * Verifica se um vídeo tem regras de agendamento
   */
  async hasScheduleRules(videoId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('campaign_schedule_rules')
        .select('id')
        .eq('campaign_video_schedules.video_id', videoId)
        .eq('is_active', true)
        .limit(1);

      if (error) return false;
      return data && data.length > 0;
    } catch {
      return false;
    }
  }
};