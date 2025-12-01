import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, startOfYesterday, endOfYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PeriodType } from '../components/PeriodSelector';

export interface PeriodAlert {
  id: string;
  device_id: string;
  device_name: string;
  provider: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
}

interface DateRange {
  start: Date;
  end: Date;
}

const getDateRange = (period: PeriodType, customStart?: Date, customEnd?: Date): DateRange => {
  const now = new Date();
  
  switch (period) {
    case 'hoje':
      return { start: startOfDay(now), end: now };
    case 'ontem':
      return { start: startOfYesterday(), end: endOfYesterday() };
    case 'esta-semana':
      return { start: startOfWeek(now, { locale: ptBR }), end: now };
    case '7dias':
      return { start: startOfDay(subDays(now, 7)), end: now };
    case '30dias':
      return { start: startOfDay(subDays(now, 30)), end: now };
    case 'personalizado':
      if (customStart && customEnd) {
        return { start: startOfDay(customStart), end: endOfDay(customEnd) };
      }
      return { start: startOfDay(now), end: now };
    default:
      return { start: startOfDay(now), end: now };
  }
};

export const usePeriodAlerts = (
  period: PeriodType = 'hoje',
  customStartDate?: Date,
  customEndDate?: Date
) => {
  const [alerts, setAlerts] = useState<PeriodAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const { start, end } = getDateRange(period, customStartDate, customEndDate);

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
        .gte('started_at', start.toISOString())
        .lte('started_at', end.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;

      const formattedAlerts: PeriodAlert[] = (data || []).map((item: any) => ({
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
      console.error('Erro ao buscar alertas:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [period, customStartDate, customEndDate]);

  // Fetch inicial e quando período muda
  useEffect(() => {
    setLoading(true);
    fetchAlerts();
  }, [fetchAlerts]);

  // Supabase Realtime - atualização instantânea
  useEffect(() => {
    const channel = supabase
      .channel('connection-history-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_history'
        },
        (payload) => {
          console.log('🔴 Realtime: Nova alteração em connection_history', payload);
          fetchAlerts();
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  // Backup: atualizar a cada 30 segundos caso realtime falhe
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return { alerts, loading, refetch: fetchAlerts };
};
