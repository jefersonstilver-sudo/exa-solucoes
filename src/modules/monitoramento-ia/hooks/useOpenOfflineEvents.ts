import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 500;

export function useOpenOfflineEvents(deviceIds: string[], enabled: boolean) {
  const queryClient = useQueryClient();
  const key = ['provider-open-offline-events', deviceIds];

  const query = useQuery({
    queryKey: key,
    enabled: enabled && deviceIds.length > 0,
    refetchInterval: 60_000,
    queryFn: async () => {
      const latest = new Map<string, string>();
      // Limit the IN list and paginate events separately; duplicate open records
      // must never cause one connection to appear more than once.
      for (let offset = 0; offset < deviceIds.length; offset += PAGE_SIZE) {
        const batch = deviceIds.slice(offset, offset + PAGE_SIZE);
        let from = 0;
        while (true) {
          const { data, error } = await supabase
            .from('connection_history')
            .select('id, computer_id, started_at')
            .in('computer_id', batch)
            .eq('event_type', 'offline')
            .is('ended_at', null)
            .order('id')
            .range(from, from + PAGE_SIZE - 1);
          if (error) throw error;
          for (const event of data || []) {
            const previous = latest.get(event.computer_id);
            if (!previous || event.started_at > previous) latest.set(event.computer_id, event.started_at);
          }
          if (!data || data.length < PAGE_SIZE) break;
          from += PAGE_SIZE;
        }
      }
      return latest;
    },
  });

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase.channel('provider-open-offline-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connection_history' }, () => {
        queryClient.invalidateQueries({ queryKey: ['provider-open-offline-events'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, queryClient]);

  return query;
}