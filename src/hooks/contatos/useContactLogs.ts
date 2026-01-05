import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContactLog {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  action_description: string | null;
  metadata: {
    user_role?: string;
    user_email?: string;
    timestamp?: string;
    action?: string;
    changed_fields?: string[];
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    contact_name?: string;
    contact_phone?: string;
    [key: string]: any;
  } | null;
  created_at: string;
  // Joined data
  user_name?: string;
  contact_name?: string;
}

interface UseContactLogsFilters {
  contactId?: string;
  userId?: string;
  actionType?: string;
  startDate?: Date;
  endDate?: Date;
}

interface UseContactLogsOptions {
  limit?: number;
  filters?: UseContactLogsFilters;
}

export const useContactLogs = (options: UseContactLogsOptions = {}) => {
  const { limit = 50, filters } = options;
  const [logs, setLogs] = useState<ContactLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const fetchLogs = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('user_activity_logs')
        .select('*')
        .eq('entity_type', 'contact')
        .order('created_at', { ascending: false })
        .range(pageNum * limit, (pageNum + 1) * limit - 1);

      // Apply filters
      if (filters?.contactId) {
        query = query.eq('entity_id', filters.contactId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.actionType) {
        query = query.eq('action_type', filters.actionType);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const logsData = data || [];
      
      // Fetch user names and contact names for the logs
      const userIds = [...new Set(logsData.map(l => l.user_id).filter(Boolean))];
      const contactIds = [...new Set(logsData.map(l => l.entity_id).filter(Boolean))];

      let userMap: Record<string, string> = {};
      let contactMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        if (profiles) {
          userMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p.full_name || 'Usuário' }), {});
        }
      }

      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, nome, empresa')
          .in('id', contactIds);
        
        if (contacts) {
          contactMap = contacts.reduce((acc, c) => ({ 
            ...acc, 
            [c.id]: c.empresa || c.nome || 'Contato' 
          }), {});
        }
      }

      const enrichedLogs: ContactLog[] = logsData.map(log => {
        const meta = log.metadata as ContactLog['metadata'];
        return {
          ...log,
          metadata: meta,
          user_name: userMap[log.user_id] || (meta?.user_email as string) || 'Sistema',
          contact_name: log.entity_id ? contactMap[log.entity_id] : undefined
        };
      });

      if (append) {
        setLogs(prev => [...prev, ...enrichedLogs]);
      } else {
        setLogs(enrichedLogs);
      }

      setHasMore(logsData.length === limit);
    } catch (err: any) {
      console.error('Erro ao buscar logs de contatos:', err);
      setError(err.message || 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  }, [limit, filters?.contactId, filters?.userId, filters?.actionType, filters?.startDate, filters?.endDate]);

  useEffect(() => {
    setPage(0);
    fetchLogs(0, false);
  }, [fetchLogs]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage, true);
  }, [page, fetchLogs]);

  const refetch = useCallback(() => {
    setPage(0);
    fetchLogs(0, false);
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    hasMore,
    loadMore,
    refetch
  };
};
