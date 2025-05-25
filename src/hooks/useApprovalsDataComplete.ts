
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useApprovalsDataComplete = () => {
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
      console.log('📊 Buscando estatísticas de aprovações atualizadas...');
      
      // Usar a função do banco para estatísticas
      const { data, error } = await supabase.rpc('get_approvals_stats');

      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const statsData = data[0];
        setStats({
          paidWithoutVideo: Number(statsData.pago_pendente_video) || 0,
          pendingApproval: Number(statsData.video_enviado) || 0,
          approved: Number(statsData.video_aprovado) || 0,
          rejected: Number(statsData.video_rejeitado) || 0
        });
        
        console.log('✅ Estatísticas atualizadas:', {
          paidWithoutVideo: statsData.pago_pendente_video,
          pendingApproval: statsData.video_enviado,
          approved: statsData.video_aprovado,
          rejected: statsData.video_rejeitado
        });
      }

    } catch (error) {
      console.error('💥 Erro ao buscar estatísticas de aprovações:', error);
      toast.error('Erro ao carregar dados de aprovações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Configurar inscrição em tempo real
    const channel = supabase
      .channel('approvals-stats-complete')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedidos' 
        }, 
        () => {
          console.log('📝 Mudança detectada, atualizando estatísticas...');
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
