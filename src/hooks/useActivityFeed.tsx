import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SystemActivity {
  id: string;
  user_id?: string;
  user_email: string;
  user_name: string;
  activity_type: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details: any;
  severity: string;
  created_at: string;
}

export const useActivityFeed = (limit: number = 50) => {
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc('get_recent_activities', {
        p_limit: limit
      });

      if (fetchError) {
        console.error('Error fetching activities:', fetchError);
        setError(fetchError.message);
        return;
      }

      setActivities(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erro inesperado ao buscar atividades');
      toast({
        title: "Erro",
        description: "Não foi possível carregar as atividades recentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Setup realtime subscription para updates em tempo real
  useEffect(() => {
    // Fetch inicial
    fetchActivities();

    // Subscription para mudanças em tempo real
    const channel = supabase
      .channel('system_activity_feed_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_activity_feed'
        },
        (payload) => {
          console.log('Nova atividade detectada:', payload);
          // Refetch para pegar os dados completos com JOIN
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities
  };
};

// Helper function para registrar atividades do frontend
export const logActivity = async (
  activityType: 'user_action' | 'admin_action' | 'system_event',
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.rpc('log_system_activity', {
      p_user_id: user?.id || null,
      p_activity_type: activityType,
      p_action: action,
      p_entity_type: entityType || null,
      p_entity_id: entityId || null,
      p_details: details || {},
      p_ip_address: null, // Pode ser implementado depois
      p_user_agent: navigator.userAgent,
      p_severity: severity
    });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};