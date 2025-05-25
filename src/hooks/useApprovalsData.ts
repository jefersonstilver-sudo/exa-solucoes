
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useApprovalsData = () => {
  const [stats, setStats] = useState({
    paidWithoutVideo: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas de aprovações
      const [
        paidWithoutVideoResult,
        pendingApprovalResult,
        approvedResult,
        rejectedResult
      ] = await Promise.all([
        supabase.from('pedidos').select('id', { count: 'exact' }).eq('status', 'pago_pendente_video'),
        supabase.from('pedidos').select('id', { count: 'exact' }).eq('status', 'video_enviado'),
        supabase.from('pedidos').select('id', { count: 'exact' }).eq('status', 'video_aprovado'),
        supabase.from('pedidos').select('id', { count: 'exact' }).eq('status', 'video_rejeitado')
      ]);

      setStats({
        paidWithoutVideo: paidWithoutVideoResult.data?.length || 0,
        pendingApproval: pendingApprovalResult.data?.length || 0,
        approved: approvedResult.data?.length || 0,
        rejected: rejectedResult.data?.length || 0
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas de aprovações:', error);
      toast.error('Erro ao carregar dados de aprovações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Configurar inscrição em tempo real
    const channel = supabase
      .channel('approvals-stats')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedidos' 
        }, 
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};
