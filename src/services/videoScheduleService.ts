import { supabase } from '@/integrations/supabase/client';

interface ScheduleRule {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface VideoSyncResponse {
  success: boolean;
  timestamp: string;
  trocas_realizadas: number;
  videos_ativados: number;
  videos_desativados: number;
  erros: string[];
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
   * IMPORTANTE: NÃO sobrescreve ativações manuais do usuário
   */
  async updateVideoSelectionStatus(pedidoVideoId: string, videoId: string): Promise<boolean> {
    try {
      // Verificar se o vídeo foi ativado manualmente
      const { data: currentVideo, error: checkError } = await supabase
        .from('pedido_videos')
        .select('is_active, selected_for_display, updated_at')
        .eq('id', pedidoVideoId)
        .eq('approval_status', 'approved')
        .single();

      if (checkError || !currentVideo) {
        console.error('❌ [SCHEDULE] Erro ao verificar vídeo:', checkError);
        return false;
      }

      // Se o vídeo foi ativado manualmente (is_active = true), 
      // NÃO sobrescrever com controle automático
      if (currentVideo.is_active) {
        console.log('⚠️ [SCHEDULE] Vídeo ativo manualmente - pulando atualização automática:', {
          pedidoVideoId,
          videoId,
          isActive: currentVideo.is_active
        });
        return true; // Retorna sucesso mas não faz alterações
      }

      const shouldBeActive = await this.isVideoActiveNow(videoId);
      
      console.log('🔄 [SCHEDULE] Atualizando status do vídeo (automático):', {
        pedidoVideoId,
        videoId,
        shouldBeActive,
        currentlySelected: currentVideo.selected_for_display
      });

      // Só atualizar se realmente mudou o status
      if (currentVideo.selected_for_display === shouldBeActive) {
        console.log('📝 [SCHEDULE] Status já está correto - sem alterações');
        return true;
      }

      const { error } = await supabase
        .from('pedido_videos')
        .update({ 
          selected_for_display: shouldBeActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', pedidoVideoId)
        .eq('approval_status', 'approved');

      if (error) {
        console.error('❌ [SCHEDULE] Erro ao atualizar status:', error);
        return false;
      }

      console.log('✅ [SCHEDULE] Status atualizado automaticamente com sucesso');
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
  },

  /**
   * Força sincronização manual via Edge Function
   */
  async forceSyncVideoSchedules(orderId?: string): Promise<VideoSyncResponse> {
    console.log('🔄 [VIDEO_SCHEDULE] Forcing video schedule sync...', { orderId });
    
    try {
      const { data, error } = await supabase.functions.invoke('video-schedule-sync', {
        body: { orderId }
      });

      if (error) {
        console.error('❌ [VIDEO_SCHEDULE] Error calling sync function:', error);
        throw error;
      }

      console.log('✅ [VIDEO_SCHEDULE] Sync completed:', data);
      return data;
    } catch (error) {
      console.error('💥 [VIDEO_SCHEDULE] Sync failed:', error);
      throw error;
    }
  },

  /**
   * Atualiza todos os vídeos de todos os pedidos ativos de um prédio
   */
  async updateAllVideosForBuilding(buildingId: string): Promise<void> {
    try {
      console.log('🏢 [SCHEDULE] Atualizando vídeos do prédio:', buildingId);

      // Buscar todos os pedidos ativos que incluem esse prédio
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('id, lista_predios, status')
        .contains('lista_predios', [buildingId])
        .in('status', ['ativo', 'pago']);

      if (error) {
        console.error('❌ [SCHEDULE] Erro ao buscar pedidos do prédio:', error);
        return;
      }

      if (!pedidos || pedidos.length === 0) {
        console.log('📋 [SCHEDULE] Nenhum pedido ativo encontrado para o prédio');
        return;
      }

      console.log(`📦 [SCHEDULE] Encontrados ${pedidos.length} pedidos ativos`);

      // Atualizar todos os vídeos de cada pedido
      const updatePromises = pedidos.map(pedido => 
        this.updateAllVideosForOrder(pedido.id)
      );

      await Promise.all(updatePromises);
      console.log('✅ [SCHEDULE] Todos os vídeos do prédio foram atualizados');

    } catch (error) {
      console.error('❌ [SCHEDULE] Erro ao atualizar vídeos do prédio:', error);
    }
  },

  /**
   * Verifica se vídeo deve estar ativo baseado em campanhas avançadas
   */
  async isVideoActiveInCampaign(videoId: string): Promise<boolean> {
    console.log('🔍 [VIDEO_SCHEDULE] Checking if video is active in campaign:', videoId);
    
    try {
      // Buscar regras ativas para este vídeo
      const { data: rules, error } = await supabase
        .from('campaign_schedule_rules')
        .select(`
          *,
          campaign_video_schedules (
            video_id,
            campaigns_advanced (
              status
            )
          )
        `)
        .eq('is_active', true)
        .eq('campaign_video_schedules.video_id', videoId);

      if (error) {
        console.error('❌ [VIDEO_SCHEDULE] Error fetching campaign rules:', error);
        return false;
      }

      if (!rules || rules.length === 0) {
        console.log('📭 [VIDEO_SCHEDULE] No active rules found for video:', videoId);
        return false;
      }

      // Verificar horário atual (horário de Brasília)
      const now = new Date();
      const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      const currentDay = brasiliaTime.getDay();
      const currentTime = brasiliaTime.toTimeString().slice(0, 5);

      for (const rule of rules) {
        const campaign = rule.campaign_video_schedules?.campaigns_advanced;
        
        // Verificar se campanha está ativa
        if (campaign?.status !== 'active') {
          continue;
        }

        // Verificar se hoje está nos dias programados
        if (!rule.days_of_week.includes(currentDay)) {
          continue;
        }

        // Verificar se estamos no horário programado
        if (currentTime >= rule.start_time && currentTime <= rule.end_time) {
          console.log('✅ [VIDEO_SCHEDULE] Video should be active now:', {
            videoId,
            currentDay,
            currentTime,
            ruleTime: `${rule.start_time}-${rule.end_time}`
          });
          return true;
        }
      }

      console.log('⏰ [VIDEO_SCHEDULE] Video not in active time window:', videoId);
      return false;
    } catch (error) {
      console.error('💥 [VIDEO_SCHEDULE] Error checking video campaign status:', error);
      return false;
    }
  }
};