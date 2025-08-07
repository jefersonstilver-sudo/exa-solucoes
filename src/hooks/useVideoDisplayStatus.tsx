
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { videoScheduleService } from '@/services/videoScheduleService';

interface VideoDisplayInfo {
  videoId: string;
  isDisplaying: boolean;
  displayStartDate?: string;
  panelCount: number;
  isScheduled?: boolean;
  scheduleActive?: boolean;
}

export const useVideoDisplayStatus = (orderId: string) => {
  const [displayingVideos, setDisplayingVideos] = useState<VideoDisplayInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchVideoDisplayStatus = async () => {
      try {
        console.log('🔍 [VIDEO_DISPLAY] Verificando status de exibição para pedido:', orderId);

        // Buscar vídeos do pedido com status aprovado e selecionado para exibição
        const { data: pedidoVideos, error } = await supabase
          .from('pedido_videos')
          .select(`
            id,
            video_id,
            selected_for_display,
            approval_status,
            is_active,
            approved_at,
            videos (
              id,
              nome,
              url,
              duracao,
              orientacao
            )
          `)
          .eq('pedido_id', orderId)
          .eq('approval_status', 'approved')
          .eq('selected_for_display', true)
          .eq('is_active', true);

        if (error) {
          console.error('❌ [VIDEO_DISPLAY] Erro ao buscar vídeos:', error);
          return;
        }

        console.log('📹 [VIDEO_DISPLAY] Vídeos em exibição encontrados:', pedidoVideos);

        const displayInfo: VideoDisplayInfo[] = [];
        
        for (const video of pedidoVideos || []) {
          // Verificar se tem regras de agendamento
          const hasSchedule = await videoScheduleService.hasScheduleRules(video.video_id);
          const scheduleActive = hasSchedule ? await videoScheduleService.isVideoActiveNow(video.video_id) : true;
          
          displayInfo.push({
            videoId: video.video_id,
            isDisplaying: video.selected_for_display && (!hasSchedule || scheduleActive),
            displayStartDate: video.approved_at,
            panelCount: 1,
            isScheduled: hasSchedule,
            scheduleActive: scheduleActive
          });
        }

        setDisplayingVideos(displayInfo);
        
        console.log('✅ [VIDEO_DISPLAY] Status processado:', displayInfo);
      } catch (error) {
        console.error('❌ [VIDEO_DISPLAY] Erro inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDisplayStatus();
  }, [orderId]);

  return {
    displayingVideos,
    loading,
    hasDisplayingVideos: displayingVideos.length > 0
  };
};
