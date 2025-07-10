
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

      // Buscar pedidos pagos que realmente não têm NENHUM vídeo enviado
      const { data: paidOrders, error: paidError } = await supabase
        .from('pedidos')
        .select(`
          id,
          pedido_videos (id)
        `)
        .eq('status', 'pago_pendente_video');

      if (paidError) throw paidError;

      // Contar apenas pedidos sem nenhum vídeo
      const paidWithoutVideoCount = (paidOrders || []).filter(
        order => !order.pedido_videos || order.pedido_videos.length === 0
      ).length;

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
        paidWithoutVideo: paidWithoutVideoCount,
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
