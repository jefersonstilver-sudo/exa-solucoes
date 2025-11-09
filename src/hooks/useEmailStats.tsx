import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmailStats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  failed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface TemplateStats {
  templateId: string;
  count: number;
  opened: number;
  clicked: number;
  failed: number;
}

export function useEmailStats(days: number = 30) {
  const [stats, setStats] = useState<EmailStats>({
    total: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
    failed: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
  });
  const [templateStats, setTemplateStats] = useState<TemplateStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [days]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Calcular data de início
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar logs dos últimos X dias
      const { data: logs, error } = await supabase
        .from('email_logs')
        .select('*')
        .gte('sent_at', startDate.toISOString());

      if (error) throw error;

      if (!logs || logs.length === 0) {
        setStats({
          total: 0,
          sent: 0,
          opened: 0,
          clicked: 0,
          failed: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
        });
        setTemplateStats([]);
        return;
      }

      // Calcular estatísticas gerais
      const total = logs.length;
      const sent = logs.filter(log => ['sent', 'delivered', 'opened', 'clicked'].includes(log.status)).length;
      const opened = logs.filter(log => log.opened_at !== null).length;
      const clicked = logs.filter(log => log.clicked_at !== null).length;
      const failed = logs.filter(log => log.status === 'failed' || log.status === 'bounced').length;

      const deliveryRate = sent > 0 ? (sent / total) * 100 : 0;
      const openRate = sent > 0 ? (opened / sent) * 100 : 0;
      const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

      setStats({
        total,
        sent,
        opened,
        clicked,
        failed,
        deliveryRate,
        openRate,
        clickRate,
      });

      // Calcular estatísticas por template
      const templateMap = new Map<string, TemplateStats>();
      
      logs.forEach(log => {
        const existing = templateMap.get(log.template_id) || {
          templateId: log.template_id,
          count: 0,
          opened: 0,
          clicked: 0,
          failed: 0,
        };

        existing.count++;
        if (log.opened_at) existing.opened++;
        if (log.clicked_at) existing.clicked++;
        if (log.status === 'failed' || log.status === 'bounced') existing.failed++;

        templateMap.set(log.template_id, existing);
      });

      setTemplateStats(Array.from(templateMap.values()));
    } catch (error) {
      console.error('Error fetching email stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    templateStats,
    loading,
    refresh: fetchStats,
  };
}
