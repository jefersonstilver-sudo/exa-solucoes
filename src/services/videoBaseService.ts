import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const setBaseVideo = async (slotId: string): Promise<boolean> => {
  try {
    console.log('⭐ [VIDEO_BASE] Definindo vídeo base:', slotId);
    
    // Obter informações do vídeo selecionado
    const { data: videoInfo, error: videoError } = await supabase
      .from('pedido_videos')
      .select('pedido_id, video_id, slot_position, approval_status')
      .eq('id', slotId)
      .single();

    if (videoError || !videoInfo) {
      console.error('❌ [VIDEO_BASE] Vídeo não encontrado:', videoError);
      toast.error('❌ Vídeo não encontrado');
      return false;
    }

    if (videoInfo.approval_status !== 'approved') {
      console.error('❌ [VIDEO_BASE] Apenas vídeos aprovados podem ser base');
      toast.error('❌ Apenas vídeos aprovados podem ser definidos como base');
      return false;
    }

    // Obter informações do vídeo base atual (se existir)
    const { data: currentBaseVideo } = await supabase
      .from('pedido_videos')
      .select('slot_position, video_id')
      .eq('pedido_id', videoInfo.pedido_id)
      .eq('is_base_video', true)
      .single();

    // Desmarcar outros vídeos base do mesmo pedido
    const { error: unsetError } = await supabase
      .from('pedido_videos')
      .update({ is_base_video: false, updated_at: new Date().toISOString() })
      .eq('pedido_id', videoInfo.pedido_id)
      .neq('id', slotId);

    if (unsetError) {
      console.error('❌ [VIDEO_BASE] Erro ao desmarcar vídeos base:', unsetError);
      throw unsetError;
    }

    // Marcar este vídeo como base
    const { error: setError } = await supabase
      .from('pedido_videos')
      .update({ is_base_video: true, updated_at: new Date().toISOString() })
      .eq('id', slotId);

    if (setError) {
      console.error('❌ [VIDEO_BASE] Erro ao marcar vídeo como base:', setError);
      throw setError;
    }

    // Desativar agendamentos do vídeo promovido a principal
    let schedulesDeactivated = false;
    try {
      const { data: schedules } = await supabase
        .from('campaign_video_schedules')
        .select('id')
        .eq('video_id', videoInfo.video_id);

      if (schedules && schedules.length > 0) {
        const scheduleIds = schedules.map(s => s.id);
        
        const { error: scheduleError } = await supabase
          .from('campaign_schedule_rules')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('campaign_video_schedule_id', scheduleIds);

        if (!scheduleError) {
          schedulesDeactivated = true;
          console.log('📅 [VIDEO_BASE] Agendamentos desativados para o vídeo principal');
        }
      }
    } catch (scheduleError) {
      console.warn('⚠️ [VIDEO_BASE] Erro ao desativar agendamentos:', scheduleError);
      // Não falhar por causa disso
    }

    // Registrar no log de gerenciamento
    try {
      await supabase
        .from('video_management_logs')
        .insert({
          pedido_id: videoInfo.pedido_id,
          action_type: 'set_base_video',
          slot_from: currentBaseVideo?.slot_position || null,
          slot_to: videoInfo.slot_position,
          video_from_id: currentBaseVideo?.video_id || null,
          video_to_id: videoInfo.video_id,
          details: {
            previous_base_slot: currentBaseVideo?.slot_position,
            new_base_slot: videoInfo.slot_position,
            schedules_deactivated: schedulesDeactivated,
            pedido_video_id: slotId
          }
        });
    } catch (logError) {
      console.warn('⚠️ [VIDEO_BASE] Erro ao registrar log:', logError);
      // Não falhar por causa disso
    }

    console.log('✅ [VIDEO_BASE] Vídeo base definido com sucesso');
    
    if (schedulesDeactivated) {
      toast.success(`✅ Vídeo do Slot ${videoInfo.slot_position} definido como principal! Agendamento desativado automaticamente.`);
    } else {
      toast.success(`✅ Vídeo do Slot ${videoInfo.slot_position} definido como principal!`);
    }
    
    return true;
  } catch (error) {
    console.error('💥 [VIDEO_BASE] Erro geral:', error);
    toast.error('❌ Erro ao definir vídeo base');
    return false;
  }
};

export const getCurrentDisplayVideo = async (orderId: string) => {
  try {
    console.log('📺 [VIDEO_DISPLAY] Obtendo vídeo atual para exibição:', orderId);
    
    const { data, error } = await supabase.rpc('get_current_display_video', {
      p_pedido_id: orderId
    });

    if (error) {
      console.error('❌ [VIDEO_DISPLAY] Erro ao obter vídeo atual:', error);
      throw error;
    }

    console.log('✅ [VIDEO_DISPLAY] Vídeo atual obtido:', data);
    return data;
  } catch (error) {
    console.error('💥 [VIDEO_DISPLAY] Erro geral:', error);
    return null;
  }
};