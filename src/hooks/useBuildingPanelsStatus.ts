import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeviceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastOnlineAt: string | null;
}

export interface BuildingPanelsStatus {
  totalPanels: number;
  onlineCount: number;
  offlineCount: number;
  percentage: number;
  status: 'all_online' | 'all_offline' | 'partial' | 'not_connected';
  devices: DeviceStatus[];
}

export const useBuildingPanelsStatus = (buildingId: string | null) => {
  return useQuery({
    queryKey: ['building-panels-status', buildingId],
    queryFn: async (): Promise<BuildingPanelsStatus> => {
      if (!buildingId) {
        return {
          totalPanels: 0,
          onlineCount: 0,
          offlineCount: 0,
          percentage: 0,
          status: 'not_connected',
          devices: []
        };
      }

      const { data: devices, error } = await supabase
        .from('devices')
        .select('id, condominio_name, status, last_online_at')
        .eq('building_id', buildingId)
        .eq('is_active', true);

      if (error || !devices || devices.length === 0) {
        return {
          totalPanels: 0,
          onlineCount: 0,
          offlineCount: 0,
          percentage: 0,
          status: 'not_connected',
          devices: []
        };
      }

      const totalPanels = devices.length;
      const onlineCount = devices.filter(d => d.status === 'online').length;
      const offlineCount = totalPanels - onlineCount;
      const percentage = Math.round((onlineCount / totalPanels) * 100);

      let status: BuildingPanelsStatus['status'] = 'not_connected';
      if (totalPanels > 0) {
        if (onlineCount === totalPanels) {
          status = 'all_online';
        } else if (onlineCount === 0) {
          status = 'all_offline';
        } else {
          status = 'partial';
        }
      }

      return {
        totalPanels,
        onlineCount,
        offlineCount,
        percentage,
        status,
        devices: devices.map(d => ({
          id: d.id,
          name: d.condominio_name || 'Painel',
          status: d.status as 'online' | 'offline',
          lastOnlineAt: d.last_online_at
        }))
      };
    },
    enabled: !!buildingId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// Hook to get panels status for multiple buildings at once
export const useBuildingsPanelsStatus = (buildingIds: string[]) => {
  return useQuery({
    queryKey: ['buildings-panels-status', buildingIds],
    queryFn: async () => {
      if (!buildingIds.length) return {};

      const { data: devices, error } = await supabase
        .from('devices')
        .select('id, building_id, condominio_name, status, last_online_at')
        .in('building_id', buildingIds)
        .eq('is_active', true);

      if (error || !devices) return {};

      // Group devices by building_id
      const statusMap: Record<string, BuildingPanelsStatus> = {};

      buildingIds.forEach(buildingId => {
        const buildingDevices = devices.filter(d => d.building_id === buildingId);
        const totalPanels = buildingDevices.length;
        const onlineCount = buildingDevices.filter(d => d.status === 'online').length;
        const offlineCount = totalPanels - onlineCount;
        const percentage = totalPanels > 0 ? Math.round((onlineCount / totalPanels) * 100) : 0;

        let status: BuildingPanelsStatus['status'] = 'not_connected';
        if (totalPanels > 0) {
          if (onlineCount === totalPanels) {
            status = 'all_online';
          } else if (onlineCount === 0) {
            status = 'all_offline';
          } else {
            status = 'partial';
          }
        }

        statusMap[buildingId] = {
          totalPanels,
          onlineCount,
          offlineCount,
          percentage,
          status,
          devices: buildingDevices.map(d => ({
            id: d.id,
            name: d.condominio_name || 'Painel',
            status: d.status as 'online' | 'offline',
            lastOnlineAt: d.last_online_at
          }))
        };
      });

      return statusMap;
    },
    enabled: buildingIds.length > 0,
    refetchInterval: 30000,
  });
};
