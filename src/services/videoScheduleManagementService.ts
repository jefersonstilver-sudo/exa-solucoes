import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScheduleRule {
  id?: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_all_day: boolean;
}

interface CampaignScheduleData {
  campaign_id: string;
  video_id: string;
  slot_position: number;
  priority: number;
}

export const videoScheduleManagementService = {
  /**
   * Criar ou atualizar regras de programação para um vídeo
   */
async updateVideoScheduleRules(
    videoId: string,
    scheduleRules: ScheduleRule[],
    slotPosition?: number
  ): Promise<boolean> {
    try {
      console.log('📅 [SCHEDULE_MGMT] Atualizando regras de programação:', {
        videoId,
        slotPosition,
        rulesCount: scheduleRules.length
      });

      // 1. Buscar se existe campanha avançada para este vídeo
      const { data: existingCampaign, error: campaignError } = await supabase
        .from('campaign_video_schedules')
        .select('id, campaign_id')
        .eq('video_id', videoId)
        .single();

      let campaignVideoScheduleId: string;

      if (existingCampaign) {
        campaignVideoScheduleId = existingCampaign.id;
        console.log('📅 [SCHEDULE_MGMT] Campanha existente encontrada:', existingCampaign.id);
      } else {
        // 2. Criar nova campanha avançada se não existir
        console.log('📅 [SCHEDULE_MGMT] Criando nova campanha avançada...');
        
        // Buscar informações do pedido através do vídeo
        const { data: videoInfo, error: videoError } = await supabase
          .from('pedido_videos')
          .select('pedido_id, slot_position, pedidos(client_id)')
          .eq('video_id', videoId)
          .single();

        if (videoError || !videoInfo) {
          throw new Error('Erro ao buscar informações do vídeo');
        }

        // Criar campanha avançada
        const { data: newCampaign, error: newCampaignError } = await supabase
          .from('campaigns_advanced')
          .insert({
            client_id: videoInfo.pedidos.client_id,
            pedido_id: videoInfo.pedido_id,
            name: `Campanha Avançada - Vídeo ${videoId}`,
            description: 'Campanha criada automaticamente para programação de vídeos',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 ano
            status: 'active'
          })
          .select('id')
          .single();

        if (newCampaignError || !newCampaign) {
          throw new Error('Erro ao criar campanha avançada');
        }

        // Criar schedule de vídeo usando a posição correta do slot
        const correctSlotPosition = slotPosition || videoInfo.slot_position || 1;
        const { data: newVideoSchedule, error: scheduleError } = await supabase
          .from('campaign_video_schedules')
          .insert({
            campaign_id: newCampaign.id,
            video_id: videoId,
            slot_position: correctSlotPosition,
            priority: 1
          })
          .select('id')
          .single();

        console.log('📅 [SCHEDULE_MGMT] Created video schedule with slot_position:', correctSlotPosition);

        if (scheduleError || !newVideoSchedule) {
          throw new Error('Erro ao criar schedule de vídeo');
        }

        campaignVideoScheduleId = newVideoSchedule.id;
      }

      // 3. Remover regras existentes
      const { error: deleteError } = await supabase
        .from('campaign_schedule_rules')
        .delete()
        .eq('campaign_video_schedule_id', campaignVideoScheduleId);

      if (deleteError) {
        throw new Error('Erro ao remover regras existentes');
      }

      // 4. Inserir novas regras
      if (scheduleRules.length > 0) {
        const rulesToInsert = scheduleRules.map(rule => ({
          campaign_video_schedule_id: campaignVideoScheduleId,
          days_of_week: rule.days_of_week,
          start_time: rule.start_time,
          end_time: rule.end_time,
          is_active: rule.is_active,
          is_all_day: rule.is_all_day || false
        }));

        const { error: insertError } = await supabase
          .from('campaign_schedule_rules')
          .insert(rulesToInsert);

        if (insertError) {
          throw new Error('Erro ao inserir novas regras');
        }
      }

      console.log('✅ [SCHEDULE_MGMT] Regras de programação atualizadas com sucesso');
      toast.success('Programação de vídeo atualizada com sucesso!');
      return true;

    } catch (error) {
      console.error('❌ [SCHEDULE_MGMT] Erro ao atualizar regras:', error);
      toast.error('Erro ao atualizar programação de vídeo');
      return false;
    }
  },

  /**
   * Buscar regras de programação para um vídeo
   */
  async getVideoScheduleRules(videoId: string): Promise<ScheduleRule[]> {
    try {
      const { data: scheduleData, error } = await supabase
        .from('campaign_video_schedules')
        .select(`
          id,
          campaign_schedule_rules (
            id,
            days_of_week,
            start_time,
            end_time,
            is_active,
            is_all_day
          )
        `)
        .eq('video_id', videoId)
        .single();

      if (error) {
        console.log('📅 [SCHEDULE_MGMT] Nenhuma regra encontrada para o vídeo:', videoId);
        return [];
      }

      return scheduleData?.campaign_schedule_rules || [];
    } catch (error) {
      console.error('❌ [SCHEDULE_MGMT] Erro ao buscar regras:', error);
      return [];
    }
  },

  /**
   * Remover uma regra específica
   */
  async removeScheduleRule(ruleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaign_schedule_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        throw error;
      }

      toast.success('Regra de programação removida com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ [SCHEDULE_MGMT] Erro ao remover regra:', error);
      toast.error('Erro ao remover regra de programação');
      return false;
    }
  },

  /**
   * Validar se há conflitos entre regras
   */
  validateScheduleConflicts(
    newRule: ScheduleRule,
    existingRules: ScheduleRule[]
  ): { hasConflict: boolean; conflictingRules: ScheduleRule[] } {
    const conflictingRules: ScheduleRule[] = [];

    for (const existingRule of existingRules) {
      if (!existingRule.is_active) continue;

      // Verificar sobreposição de dias
      const daysOverlap = newRule.days_of_week.some(day => 
        existingRule.days_of_week.includes(day)
      );

      if (daysOverlap) {
        // Verificar sobreposição de horários
        const newStart = this.timeToMinutes(newRule.start_time);
        const newEnd = this.timeToMinutes(newRule.end_time);
        const existingStart = this.timeToMinutes(existingRule.start_time);
        const existingEnd = this.timeToMinutes(existingRule.end_time);

        if (newStart < existingEnd && newEnd > existingStart) {
          conflictingRules.push(existingRule);
        }
      }
    }

    return {
      hasConflict: conflictingRules.length > 0,
      conflictingRules
    };
  },

  /**
   * Converter horário para minutos desde meia-noite
   */
  timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  },

  /**
   * Formatar dias da semana para exibição
   */
  formatDaysOfWeek(daysOfWeek: number[]): string {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    if (daysOfWeek.length === 7) return 'Todos os dias';
    if (daysOfWeek.length === 5 && !daysOfWeek.includes(0) && !daysOfWeek.includes(6)) {
      return 'Segunda a Sexta';
    }
    if (daysOfWeek.length === 2 && daysOfWeek.includes(0) && daysOfWeek.includes(6)) {
      return 'Fim de semana';
    }

    return daysOfWeek
      .sort()
      .map(day => dayNames[day])
      .join(', ');
  }
};