import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOfflineAlerts = () => {
  const [offlineCount, setOfflineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOfflineCount = async () => {
    try {
      const result = await (supabase
        .from('devices') as any)
        .select('id')
        .eq('is_online', false);

      if (result.error) {
        console.error('[useOfflineAlerts] Error fetching:', result.error);
        return;
      }

      setOfflineCount(result.data?.length || 0);
    } catch (error) {
      console.error('[useOfflineAlerts] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfflineCount();

    const interval = setInterval(fetchOfflineCount, 60000);

    const channel = supabase
      .channel('offline_alerts_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices'
        },
        () => {
          fetchOfflineCount();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return { offlineCount, loading };
};
