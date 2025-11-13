import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { resendSyncCache } from '@/lib/resendSyncCache';

export interface EmailLog {
  id: string;
  resend_id: string | null;
  template_id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  metadata: any;
  error_message: string | null;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  delivered_at: string | null;
  bounced_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useEmailHistory = (days: number = 30, fetchAll: boolean = false) => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchHistory = async (page: number = 1, pageSize: number = 50) => {
    try {
      setLoading(true);
      
      // Sincronizar emails do Resend usando cache para evitar rate limiting
      try {
        await resendSyncCache.sync(async () => {
          console.log('📧 [EMAIL HISTORY] Syncing with Resend API...');
          const { data: syncData, error: syncError } = await supabase.functions.invoke('fetch-resend-emails');
          
          if (syncError) {
            console.error('❌ [EMAIL HISTORY] Error syncing with Resend:', syncError);
            throw syncError;
          }
          
          console.log('✅ [EMAIL HISTORY] Resend sync successful:', syncData);
          return syncData;
        });
      } catch (syncError) {
        console.error('❌ [EMAIL HISTORY] Failed to sync with Resend:', syncError);
        // Continuar mesmo se falhar a sincronização
      }

      // Calcular data de início baseado no período
      let query = supabase
        .from('email_logs')
        .select('*', { count: 'exact' });

      if (!fetchAll) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('sent_at', startDate.toISOString());
      }

      const { data, count, error } = await query
        .order('sent_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      setEmails(data || []);
      setTotalCount(count || 0);

    } catch (error: any) {
      console.error('❌ Erro ao buscar histórico de emails:', error);
      toast.error('Erro ao carregar histórico de emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    
    // Atualizar a cada 2 minutos
    const interval = setInterval(() => fetchHistory(), 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [days, fetchAll]);

  return { 
    emails, 
    loading, 
    totalCount,
    refetch: fetchHistory 
  };
};
