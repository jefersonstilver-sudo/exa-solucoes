import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PeriodType } from '../components/PeriodSelector';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface PeriodEventsResult {
  eventsMap: Map<string, number>;
  loading: boolean;
  refetch: () => void;
}

// Calculate date range based on period
const getDateRange = (
  period: PeriodType,
  customStart?: Date,
  customEnd?: Date
): { start: Date; end: Date } => {
  const now = new Date();
  
  switch (period) {
    case 'hoje':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'ontem':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case 'esta-semana':
      return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) };
    case '7dias':
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    case '30dias':
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case 'personalizado':
      if (customStart && customEnd) {
        return { start: startOfDay(customStart), end: endOfDay(customEnd) };
      }
      return { start: startOfDay(now), end: endOfDay(now) };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
};

export const usePeriodDeviceEvents = (
  period: PeriodType = 'hoje',
  customStart?: Date,
  customEnd?: Date
): PeriodEventsResult => {
  const [eventsMap, setEventsMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const dateRange = useMemo(() => 
    getDateRange(period, customStart, customEnd), 
    [period, customStart, customEnd]
  );

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Query connection_history for OFFLINE events only (real falls)
      const { data, error } = await supabase
        .from('connection_history')
        .select('computer_id')
        .eq('event_type', 'offline')
        .gte('started_at', dateRange.start.toISOString())
        .lte('started_at', dateRange.end.toISOString());

      if (error) {
        console.error('[usePeriodDeviceEvents] Error fetching events:', error);
        return;
      }

      // Count events per device
      const countMap = new Map<string, number>();
      (data || []).forEach(row => {
        const deviceId = row.computer_id;
        countMap.set(deviceId, (countMap.get(deviceId) || 0) + 1);
      });

      setEventsMap(countMap);
    } catch (err) {
      console.error('[usePeriodDeviceEvents] Exception:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Realtime subscription for connection_history changes
  useEffect(() => {
    const channel = supabase
      .channel('period-events-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_history'
        },
        () => {
          // Refetch when any change occurs
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  return {
    eventsMap,
    loading,
    refetch: fetchEvents
  };
};
