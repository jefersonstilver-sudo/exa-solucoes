
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

      // Buscar TODOS os pedidos pagos (incluindo todos os status relevantes)
      const { data: allPaidOrders, error: paidError } = await supabase
        .from('pedidos')
        .select(`
          id,
          status,
          pedido_videos (
            id,
            approval_status
          )
        `)
        .in('status', ['pago', 'pago_pendente_video', 'video_enviado']);

      if (paidError) throw paidError;

      // Contar pedidos SEM vídeos APROVADOS (inclui pedidos sem vídeo + com vídeos pending/rejected)
      const paidWithoutApprovedVideo = (allPaidOrders || []).filter(order => {
        // Se não tem vídeos, conta como "aguardando vídeo"
        if (!order.pedido_videos || order.pedido_videos.length === 0) {
          return true;
        }
        // Se tem vídeos mas nenhum aprovado, conta como "aguardando vídeo"
        return !order.pedido_videos.some(video => video.approval_status === 'approved');
      }).length;

      // Buscar estatísticas de vídeos em paralelo
      const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
        supabase.from('pedido_videos').select('id', { count: 'exact' }).eq('approval_status', 'pending'),
        supabase.from('pedido_videos').select('id', { count: 'exact' }).eq('approval_status', 'approved'),
        supabase.from('pedido_videos').select('id', { count: 'exact' }).eq('approval_status', 'rejected')
      ]);

      if (pendingResult.error) throw pendingResult.error;
      if (approvedResult.error) throw approvedResult.error;
      if (rejectedResult.error) throw rejectedResult.error;

      const newStats = {
        paidWithoutVideo: paidWithoutApprovedVideo,
        pendingApproval: pendingResult.count || 0,
        approved: approvedResult.count || 0,
        rejected: rejectedResult.count || 0
      };

      setStats(newStats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
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
