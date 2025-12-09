import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UptimeRecord {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  is_current: boolean;
  ended_by_device_name?: string;
}

export interface FullUptimeData {
  isFullUptime: boolean;
  currentDuration: number; // seconds
  currentStartedAt: Date | null;
  record: UptimeRecord | null;
  history: UptimeRecord[];
  loading: boolean;
  totalDevices: number;
  onlineDevices: number;
}

const SIGNIFICANT_OUTAGE_MINUTES = 10;

export const useFullUptimeMode = () => {
  const [data, setData] = useState<FullUptimeData>({
    isFullUptime: false,
    currentDuration: 0,
    currentStartedAt: null,
    record: null,
    history: [],
    loading: true,
    totalDevices: 0,
    onlineDevices: 0
  });

  const checkUptimeStatus = useCallback(async () => {
    try {
      // Get device status
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('id, name, status, last_online_at')
        .eq('is_active', true);

      if (devicesError) throw devicesError;

      const totalDevices = devices?.length || 0;
      const onlineDevices = devices?.filter(d => d.status === 'online').length || 0;
      const allOnline = totalDevices > 0 && onlineDevices === totalDevices;

      // Check for significant outages (≥10 min) in connection_history
      const tenMinutesAgo = new Date(Date.now() - SIGNIFICANT_OUTAGE_MINUTES * 60 * 1000).toISOString();
      
      const { data: recentOutages } = await supabase
        .from('connection_history')
        .select('*')
        .eq('event_type', 'offline')
        .gte('duration_seconds', SIGNIFICANT_OUTAGE_MINUTES * 60)
        .order('ended_at', { ascending: false })
        .limit(1);

      // Get current uptime record
      const { data: currentRecord } = await supabase
        .from('uptime_records')
        .select('*')
        .eq('is_current', true)
        .single();

      // Get record (longest uptime)
      const { data: allRecords } = await supabase
        .from('uptime_records')
        .select('*')
        .order('duration_seconds', { ascending: false })
        .limit(1);

      // Get history (last 10 periods)
      const { data: history } = await supabase
        .from('uptime_records')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      // Calculate current duration
      let currentDuration = 0;
      let currentStartedAt: Date | null = null;
      let isFullUptime = false;

      if (currentRecord && allOnline) {
        currentStartedAt = new Date(currentRecord.started_at);
        currentDuration = Math.floor((Date.now() - currentStartedAt.getTime()) / 1000);
        isFullUptime = true;
      } else if (allOnline && !currentRecord) {
        // All online but no record yet - create one
        const { data: newRecord } = await supabase
          .from('uptime_records')
          .insert({ started_at: new Date().toISOString(), is_current: true })
          .select()
          .single();
        
        if (newRecord) {
          currentStartedAt = new Date(newRecord.started_at);
          currentDuration = 0;
          isFullUptime = true;
        }
      }

      // If not all online but we have a current record, close it
      if (!allOnline && currentRecord) {
        const offlineDevice = devices?.find(d => d.status === 'offline');
        await supabase
          .from('uptime_records')
          .update({
            ended_at: new Date().toISOString(),
            is_current: false,
            duration_seconds: Math.floor((Date.now() - new Date(currentRecord.started_at).getTime()) / 1000),
            ended_by_device_name: offlineDevice?.name || 'Dispositivo desconhecido'
          })
          .eq('id', currentRecord.id);
      }

      setData({
        isFullUptime,
        currentDuration,
        currentStartedAt,
        record: allRecords?.[0] || null,
        history: history || [],
        loading: false,
        totalDevices,
        onlineDevices
      });
    } catch (error) {
      console.error('[useFullUptimeMode] Error:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Update duration every second when in full uptime mode
  useEffect(() => {
    if (!data.isFullUptime || !data.currentStartedAt) return;

    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        currentDuration: Math.floor((Date.now() - (prev.currentStartedAt?.getTime() || Date.now())) / 1000)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [data.isFullUptime, data.currentStartedAt]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    checkUptimeStatus();

    // Subscribe to device changes
    const devicesChannel = supabase
      .channel('uptime_devices_monitor')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'devices'
      }, () => {
        checkUptimeStatus();
      })
      .subscribe();

    // Subscribe to uptime records changes
    const uptimeChannel = supabase
      .channel('uptime_records_monitor')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'uptime_records'
      }, () => {
        checkUptimeStatus();
      })
      .subscribe();

    // Refresh every 30 seconds
    const refreshInterval = setInterval(checkUptimeStatus, 30000);

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(uptimeChannel);
      clearInterval(refreshInterval);
    };
  }, [checkUptimeStatus]);

  return data;
};

// Helper to format duration
export const formatUptimeDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}min ${secs}s`;
  } else {
    return `${minutes}min ${secs}s`;
  }
};
