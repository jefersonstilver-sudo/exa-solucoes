import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EmailAuditLog {
  id: string;
  created_at: string;
  email_type: string;
  recipient_email: string;
  recipient_id?: string | null;
  recipient_name?: string | null;
  status: string;
  resend_email_id?: string | null;
  error_message?: string | null;
  retry_count: number;
  metadata?: any;
  pedido_id?: string | null;
  video_id?: string | null;
}

export function useEmailAuditLogs() {
  const [logs, setLogs] = useState<EmailAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    successRate: 0,
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setLogs(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const sent = data?.filter(log => log.status === 'sent').length || 0;
      const failed = data?.filter(log => log.status === 'failed').length || 0;
      const pending = data?.filter(log => log.status === 'pending').length || 0;
      const successRate = total > 0 ? (sent / total) * 100 : 0;

      setStats({
        total,
        sent,
        failed,
        pending,
        successRate: Math.round(successRate * 10) / 10,
      });
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('email-audit-logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_audit_log',
        },
        () => {
          fetchLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    logs,
    loading,
    stats,
    refetch: fetchLogs,
  };
}