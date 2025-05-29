
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ApprovalStats {
  paidWithoutVideo: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
}

export const useRealApprovalsData = () => {
  const [stats, setStats] = useState<ApprovalStats>({
    paidWithoutVideo: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Buscando estatísticas de aprovação atualizadas...');

      // Buscar pedidos pagos sem vídeo
      const { data: paidOrders, error: paidError } = await supabase
        .from('pedidos')
        .select('id')
        .eq('status', 'pago_pendente_video');

      if (paidError) throw paidError;

      // Filtrar apenas os que realmente não têm vídeos
      const ordersWithoutVideo = await Promise.all(
        (paidOrders || []).map(async (order) => {
          const { data: videos } = await supabase
            .from('pedido_videos')
            .select('id')
            .eq('pedido_id', order.id)
            .limit(1);
          
          return videos?.length === 0 ? order : null;
        })
      );

      const paidWithoutVideoCount = ordersWithoutVideo.filter(Boolean).length;

      // Buscar estatísticas de vídeos
      const { data: pendingVideos, error: pendingError } = await supabase
        .from('pedido_videos')
        .select('id')
        .eq('approval_status', 'pending');

      if (pendingError) throw pendingError;

      const { data: approvedVideos, error: approvedError } = await supabase
        .from('pedido_videos')
        .select('id')
        .eq('approval_status', 'approved');

      if (approvedError) throw approvedError;

      const { data: rejectedVideos, error: rejectedError } = await supabase
        .from('pedido_videos')
        .select('id')
        .eq('approval_status', 'rejected');

      if (rejectedError) throw rejectedError;

      const newStats = {
        paidWithoutVideo: paidWithoutVideoCount,
        pendingApproval: pendingVideos?.length || 0,
        approved: approvedVideos?.length || 0,
        rejected: rejectedVideos?.length || 0
      };

      console.log('✅ Estatísticas atualizadas:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    console.log('🔄 Refazendo busca de estatísticas...');
    fetchStats();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refetch
  };
};
