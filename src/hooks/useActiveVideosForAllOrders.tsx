import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { videoScheduleService } from '@/services/videoScheduleService';

interface ActiveVideoInfo {
  orderId: string;
  videoId: string;
  videoName: string;
  isDisplaying: boolean;
  isScheduled: boolean;
  scheduleActive: boolean;
  pedidoVideoId: string;
  clientEmail?: string;
}

export const useActiveVideosForAllOrders = () => {
  const [activeVideos, setActiveVideos] = useState<ActiveVideoInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveVideos = async () => {
    try {
      console.log('🔍 [ACTIVE_VIDEOS] Buscando vídeos em exibição...');

      // Buscar todos os pedidos ativos com vídeos aprovados e selecionados
      const { data: activeOrders, error } = await supabase
        .from('pedido_videos')
        .select(`
          id,
          pedido_id,
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
          ),
          pedidos (
            id,
            status,
            data_inicio,
            data_fim,
            client_id,
            users (
              email
            )
          )
        `)
        .eq('approval_status', 'approved')
        .eq('selected_for_display', true)
        .eq('is_active', true)
        .in('pedidos.status', ['ativo', 'video_aprovado']);

      if (error) {
        console.error('❌ [ACTIVE_VIDEOS] Erro ao buscar vídeos:', error);
        return;
      }

      const videoInfo: ActiveVideoInfo[] = [];
      
      for (const videoOrder of activeOrders || []) {
        // Verificar se tem regras de agendamento
        const hasSchedule = await videoScheduleService.hasScheduleRules(videoOrder.video_id);
        const scheduleActive = hasSchedule ? await videoScheduleService.isVideoActiveNow(videoOrder.video_id) : true;
        
        // Só incluir se está realmente em exibição (sem agendamento ou agendamento ativo)
        const isCurrentlyDisplaying = !hasSchedule || (hasSchedule && scheduleActive);

        if (isCurrentlyDisplaying) {
          videoInfo.push({
            orderId: videoOrder.pedido_id,
            videoId: videoOrder.video_id,
            videoName: videoOrder.videos?.nome || 'Vídeo sem nome',
            isDisplaying: true,
            isScheduled: hasSchedule,
            scheduleActive: scheduleActive,
            pedidoVideoId: videoOrder.id,
            clientEmail: videoOrder.pedidos?.users?.email
          });
        }
      }

      console.log('✅ [ACTIVE_VIDEOS] Vídeos ativos encontrados:', videoInfo.length);
      setActiveVideos(videoInfo);
      
    } catch (error) {
      console.error('❌ [ACTIVE_VIDEOS] Erro inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  const blockVideo = async (pedidoVideoId: string, reason: string) => {
    try {
      console.log('🚫 [ACTIVE_VIDEOS] Bloqueando pedido por motivo de segurança:', reason);

      // Primeiro buscar o pedido_id do vídeo
      const { data: videoData, error: videoError } = await supabase
        .from('pedido_videos')
        .select('pedido_id')
        .eq('id', pedidoVideoId)
        .single();

      if (videoError) {
        console.error('❌ [ACTIVE_VIDEOS] Erro ao buscar vídeo:', videoError);
        throw videoError;
      }

      const { data, error } = await supabase.rpc('block_order_secure', {
        p_pedido_id: videoData.pedido_id,
        p_reason: reason,
        p_ip_address: null, // Será capturado pela função se necessário
        p_user_agent: navigator.userAgent
      });

      if (error) {
        console.error('❌ [ACTIVE_VIDEOS] Erro ao bloquear pedido:', error);
        throw error;
      }

      const response = data as any;
      if (!response?.success) {
        throw new Error(response?.error || 'Falha ao bloquear pedido');
      }

      // Atualizar lista local
      await fetchActiveVideos();
      console.log('✅ [ACTIVE_VIDEOS] Pedido bloqueado com sucesso:', response?.message);
      
    } catch (error) {
      console.error('❌ [ACTIVE_VIDEOS] Erro ao bloquear pedido:', error);
      throw error;
    }
  };

  const deleteVideo = async (pedidoVideoId: string) => {
    try {
      console.log('🗑️ [ACTIVE_VIDEOS] Removendo vídeo:', pedidoVideoId);

      const { error } = await supabase
        .from('pedido_videos')
        .delete()
        .eq('id', pedidoVideoId);

      if (error) {
        console.error('❌ [ACTIVE_VIDEOS] Erro ao remover vídeo:', error);
        throw error;
      }

      // Atualizar lista local
      await fetchActiveVideos();
      console.log('✅ [ACTIVE_VIDEOS] Vídeo removido com sucesso');
      
    } catch (error) {
      console.error('❌ [ACTIVE_VIDEOS] Erro ao remover vídeo:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchActiveVideos();
    
    // Atualizar a cada 2 minutos para manter sincronizado
    const interval = setInterval(fetchActiveVideos, 120000);
    return () => clearInterval(interval);
  }, []);

  return {
    activeVideos,
    loading,
    blockVideo,
    deleteVideo,
    refetch: fetchActiveVideos
  };
};