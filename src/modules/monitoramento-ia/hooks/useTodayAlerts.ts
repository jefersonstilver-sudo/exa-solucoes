import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay } from 'date-fns';

export interface TodayAlert {
  id: string;
  device_id: string;
  device_name: string;
  provider: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
}

export const useTodayAlerts = () => {
  const [alerts, setAlerts] = useState<TodayAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayAlerts = async () => {
    try {
      const startDate = startOfDay(new Date());

      const { data, error } = await supabase
        .from('connection_history')
        .select(`
          id,
          computer_id,
          started_at,
          ended_at,
          duration_seconds,
          devices!inner(id, name, comments, provider)
        `)
        .eq('event_type', 'offline')
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;

      const formattedAlerts: TodayAlert[] = (data || []).map((item: any) => ({
        id: item.id,
        device_id: item.computer_id,
        device_name: (item.devices?.comments || item.devices?.name || '').split(' - ')[0].trim(),
        provider: item.devices?.provider || 'Sem provedor',
        started_at: item.started_at,
        ended_at: item.ended_at,
        duration_seconds: item.duration_seconds || 0,
      }));

      setAlerts(formattedAlerts);
    } catch (error) {
      console.error('Erro ao buscar alertas de hoje:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAlerts();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchTodayAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return { alerts, loading, refetch: fetchTodayAlerts };
};
