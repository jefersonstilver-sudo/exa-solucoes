import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export type DeviceStatus = 'online' | 'offline' | 'not_connected';

export interface BuildingDeviceInfo {
  deviceId: string | null;
  status: DeviceStatus;
  lastOnlineAt: string | null;
  condominioName: string | null;
}

export interface OutageEvent {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  eventType: string;
}

// Hook para buscar status do device de um building específico
export const useBuildingDeviceStatus = (deviceId: string | null) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['building-device-status', deviceId],
    queryFn: async (): Promise<BuildingDeviceInfo> => {
      if (!deviceId) {
        return {
          deviceId: null,
          status: 'not_connected',
          lastOnlineAt: null,
          condominioName: null
        };
      }

      const { data: device, error } = await supabase
        .from('devices')
        .select('id, status, last_online_at, condominio_name')
        .eq('id', deviceId)
        .single();

      if (error || !device) {
        console.error('❌ [useBuildingDeviceStatus] Error:', error);
        return {
          deviceId,
          status: 'not_connected',
          lastOnlineAt: null,
          condominioName: null
        };
      }

      return {
        deviceId: device.id,
        status: device.status as DeviceStatus || 'offline',
        lastOnlineAt: device.last_online_at,
        condominioName: device.condominio_name
      };
    },
    enabled: true,
    refetchInterval: 30000 // Atualiza a cada 30s
  });

  // Realtime subscription para updates do device
  useEffect(() => {
    if (!deviceId) return;

    const channel = supabase
      .channel(`device-status-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `id=eq.${deviceId}`
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, refetch]);

  return {
    ...data,
    isLoading,
    refetch
  };
};

// Hook para buscar histórico de quedas de um device
export const useBuildingOutageHistory = (
  deviceId: string | null,
  period: 'today' | '7days' | '30days' | 'custom' = 'today',
  customStartDate?: Date,
  customEndDate?: Date
) => {
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = customStartDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = customEndDate || now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    return { startDate, endDate };
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['building-outage-history', deviceId, period, customStartDate?.toISOString(), customEndDate?.toISOString()],
    queryFn: async (): Promise<{ outages: OutageEvent[]; count: number }> => {
      if (!deviceId) {
        return { outages: [], count: 0 };
      }

      const { startDate, endDate } = getDateRange();

      const { data: events, error } = await supabase
        .from('connection_history')
        .select('id, started_at, ended_at, duration_seconds, event_type')
        .eq('computer_id', deviceId)
        .eq('event_type', 'offline')
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString())
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ [useBuildingOutageHistory] Error:', error);
        return { outages: [], count: 0 };
      }

      const outages: OutageEvent[] = (events || []).map(event => ({
        id: event.id,
        startedAt: event.started_at,
        endedAt: event.ended_at,
        durationSeconds: event.duration_seconds,
        eventType: event.event_type
      }));

      return { outages, count: outages.length };
    },
    enabled: !!deviceId
  });

  return {
    outages: data?.outages || [],
    count: data?.count || 0,
    isLoading,
    refetch
  };
};

// Hook para buscar status de múltiplos buildings de uma vez
export const useBuildingsWithDeviceStatus = (buildingIds: string[]) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['buildings-device-status', buildingIds],
    queryFn: async () => {
      if (!buildingIds.length) return {};

      const { data: buildings, error } = await supabase
        .from('buildings')
        .select(`
          id,
          device_id,
          devices:device_id (
            id,
            status,
            last_online_at,
            condominio_name
          )
        `)
        .in('id', buildingIds);

      if (error) {
        console.error('❌ [useBuildingsWithDeviceStatus] Error:', error);
        return {};
      }

      const statusMap: Record<string, BuildingDeviceInfo> = {};
      
      buildings?.forEach((building: any) => {
        const device = building.devices;
        statusMap[building.id] = {
          deviceId: building.device_id,
          status: device?.status || 'not_connected',
          lastOnlineAt: device?.last_online_at || null,
          condominioName: device?.condominio_name || null
        };
      });

      return statusMap;
    },
    enabled: buildingIds.length > 0,
    refetchInterval: 30000
  });

  return {
    statusMap: data || {},
    isLoading,
    refetch
  };
};
