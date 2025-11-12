import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para limpeza forçada de slots corrompidos
 * Bypassa todas as validações de segurança
 */
export const useForceCleanup = () => {
  const forceCleanupSlot = async (slotId: string, slotPosition: number) => {
    const confirmed = window.confirm(
      `⚠️ ATENÇÃO: Limpeza Forçada\n\n` +
      `Isso vai DELETAR permanentemente:\n` +
      `- O vídeo do Slot ${slotPosition}\n` +
      `- Todos os agendamentos associados\n` +
      `- Dados do pedido_video\n\n` +
      `Esta ação NÃO PODE ser desfeita!\n\n` +
      `Deseja continuar?`
    );

    if (!confirmed) return false;

    try {
      console.log('🧹 [FORCE_CLEANUP] Iniciando limpeza forçada:', {
        slotId,
        slotPosition,
        timestamp: new Date().toISOString()
      });

      // 1. Buscar video_id
      const { data: pedidoVideo, error: fetchError } = await supabase
        .from('pedido_videos')
        .select('video_id')
        .eq('id', slotId)
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar video_id:', fetchError);
        throw new Error('Não foi possível encontrar o vídeo');
      }

      const videoId = pedidoVideo.video_id;

      console.log('📹 [FORCE_CLEANUP] video_id encontrado:', videoId);

      // 2. Buscar campaign_video_schedules
      const { data: schedules } = await supabase
        .from('campaign_video_schedules')
        .select('id')
        .eq('video_id', videoId);

      console.log('📅 [FORCE_CLEANUP] Schedules encontrados:', schedules?.length || 0);

      // 3. Deletar regras de agendamento
      if (schedules && schedules.length > 0) {
        const scheduleIds = schedules.map(s => s.id);
        
        const { error: rulesError } = await supabase
          .from('campaign_schedule_rules')
          .delete()
          .in('campaign_video_schedule_id', scheduleIds);

        if (rulesError) {
          console.error('⚠️ Erro ao deletar regras (continuando):', rulesError);
        } else {
          console.log('✅ Regras deletadas');
        }

        // 4. Deletar schedules
        const { error: schedulesError } = await supabase
          .from('campaign_video_schedules')
          .delete()
          .eq('video_id', videoId);

        if (schedulesError) {
          console.error('⚠️ Erro ao deletar schedules (continuando):', schedulesError);
        } else {
          console.log('✅ Schedules deletados');
        }
      }

      // 5. Deletar pedido_video
      const { error: pedidoError } = await supabase
        .from('pedido_videos')
        .delete()
        .eq('id', slotId);

      if (pedidoError) throw pedidoError;

      console.log('✅ pedido_video deletado');

      // 6. Deletar vídeo
      const { error: videoError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (videoError) {
        console.error('⚠️ Erro ao deletar vídeo (continuando):', videoError);
      } else {
        console.log('✅ Vídeo deletado');
      }

      console.log('🎉 [FORCE_CLEANUP] Limpeza concluída com sucesso!');
      toast.success(`Slot ${slotPosition} limpo com sucesso!`);
      
      return true;

    } catch (error: any) {
      console.error('💥 [FORCE_CLEANUP] Erro fatal:', error);
      toast.error(`Erro na limpeza: ${error.message || 'Erro desconhecido'}`);
      return false;
    }
  };

  return { forceCleanupSlot };
};
