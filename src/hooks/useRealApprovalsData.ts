
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      
      const { data, error } = await supabase.rpc('get_real_approval_stats');
      
      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        setStats({
          paidWithoutVideo: result.paid_without_video || 0,
          pendingApproval: result.pending_approval || 0,
          approved: result.approved || 0,
          rejected: result.rejected || 0
        });
      }
    } catch (error: any) {
      console.error('💥 Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas de aprovação');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
};
