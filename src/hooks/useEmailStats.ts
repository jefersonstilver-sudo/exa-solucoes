import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailStats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export const useEmailStats = (days: number = 30, fetchAll: boolean = false) => {
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    failed: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Primeiro, sincronizar emails do Resend
      console.log('📊 Sincronizando emails do Resend...');
      await supabase.functions.invoke('fetch-resend-emails');
      
      // Calcular data de início baseado no período
      let query = supabase
        .from('email_logs')
        .select('*', { count: 'exact' });

      if (!fetchAll) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('sent_at', startDate.toISOString());
      }

      const { data: logs, count, error } = await query;

      if (error) throw error;

      const total = count || 0;
      const sent = logs?.filter(l => 
        l.status === 'delivered' || l.status === 'opened' || l.status === 'clicked'
      ).length || 0;
      const opened = logs?.filter(l => 
        l.status === 'opened' || l.status === 'clicked'
      ).length || 0;
      const clicked = logs?.filter(l => l.status === 'clicked').length || 0;
      const bounced = logs?.filter(l => l.status === 'bounced').length || 0;
      const failed = logs?.filter(l => l.status === 'failed').length || 0;

      const deliveryRate = total > 0 ? (sent / total) * 100 : 0;
      const openRate = sent > 0 ? (opened / sent) * 100 : 0;
      const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

      setStats({
        total,
        sent,
        opened,
        clicked,
        bounced,
        failed,
        deliveryRate,
        openRate,
        clickRate,
      });

    } catch (error: any) {
      console.error('❌ Erro ao buscar estatísticas de email:', error);
      toast.error('Erro ao carregar estatísticas de emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [days, fetchAll]);

  return { stats, loading, refetch: fetchStats };
};
