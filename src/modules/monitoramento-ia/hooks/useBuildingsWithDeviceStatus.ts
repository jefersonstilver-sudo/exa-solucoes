/**
 * Hook: useBuildingsWithDeviceStatus
 * Agrega status dos devices por prédio para exibição no mapa
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BuildingWithDeviceStatus {
  id: string;
  nome: string;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  manual_latitude: number | null;
  manual_longitude: number | null;
  devices: DeviceInfo[];
  status: 'online' | 'partial' | 'offline' | 'unknown';
  onlineCount: number;
  offlineCount: number;
  totalDevices: number;
  eventsCount: number;
  provider?: string;
}

export interface DeviceInfo {
  id: string;
  alias: string;
  status: string;
  provider?: string;
}

// Provider colors mapping
export const PROVIDER_COLORS: Record<string, string> = {
  'COPEL': '#F97316', // orange
  'DESKTOP': '#10B981', // green
  'ALGAR': '#8B5CF6', // purple
  'CLARO': '#EF4444', // red
  'VIVO': '#A855F7', // purple
  'OI': '#FBBF24', // yellow
  'TELECOM FOZ': '#3B82F6', // blue
  'default': '#6B7280', // gray
};

export function useBuildingsWithDeviceStatus(eventsMap?: Map<string, number>) {
  const [buildings, setBuildings] = useState<BuildingWithDeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estabilizar referência do eventsMap para evitar re-fetches
  const eventsMapRef = useMemo(() => eventsMap, [eventsMap?.size]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch buildings with coordinates
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('id, nome, endereco, latitude, longitude, manual_latitude, manual_longitude')
        .or('latitude.neq.0,manual_latitude.neq.0');

      if (buildingsError) throw buildingsError;

      // Fetch devices with building_id
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('id, name, status, building_id, provider')
        .not('building_id', 'is', null);

      if (devicesError) throw devicesError;

      // Aggregate devices by building
      const buildingsWithStatus: BuildingWithDeviceStatus[] = (buildingsData || [])
        .filter(b => {
          // Has valid coordinates (manual or auto)
          const hasManual = b.manual_latitude && b.manual_longitude && 
                           b.manual_latitude !== 0 && b.manual_longitude !== 0;
          const hasAuto = b.latitude && b.longitude && 
                         b.latitude !== 0 && b.longitude !== 0;
          return hasManual || hasAuto;
        })
        .map(building => {
          const buildingDevices = (devicesData || [])
            .filter(d => d.building_id === building.id)
            .map(d => ({
              id: d.id,
              alias: d.name || 'Sem nome',
              status: d.status || 'unknown',
              provider: d.provider || undefined,
            }));

          const onlineCount = buildingDevices.filter(d => d.status === 'online').length;
          const offlineCount = buildingDevices.filter(d => d.status === 'offline').length;
          const totalDevices = buildingDevices.length;

          // Calculate aggregated status
          let status: 'online' | 'partial' | 'offline' | 'unknown' = 'unknown';
          if (totalDevices === 0) {
            status = 'unknown';
          } else if (onlineCount === totalDevices) {
            status = 'online';
          } else if (offlineCount === totalDevices) {
            status = 'offline';
          } else {
            status = 'partial';
          }

          // Get events count for devices in this building
          let eventsCount = 0;
          if (eventsMapRef) {
            buildingDevices.forEach(d => {
              eventsCount += eventsMapRef.get(d.id) || 0;
            });
          }

          // Get primary provider (most common among devices)
          const providerCounts: Record<string, number> = {};
          buildingDevices.forEach(d => {
            if (d.provider) {
              providerCounts[d.provider] = (providerCounts[d.provider] || 0) + 1;
            }
          });
          const primaryProvider = Object.entries(providerCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0];

          return {
            ...building,
            devices: buildingDevices,
            status,
            onlineCount,
            offlineCount,
            totalDevices,
            eventsCount,
            provider: primaryProvider,
          };
        })
        .filter(b => b.totalDevices > 0); // Only buildings with devices

      setBuildings(buildingsWithStatus);
    } catch (error) {
      console.error('[useBuildingsWithDeviceStatus] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [eventsMapRef]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const stats = useMemo(() => {
    const total = buildings.length;
    const online = buildings.filter(b => b.status === 'online').length;
    const partial = buildings.filter(b => b.status === 'partial').length;
    const offline = buildings.filter(b => b.status === 'offline').length;
    return { total, online, partial, offline };
  }, [buildings]);

  return {
    buildings,
    loading,
    stats,
    refetch: fetchData,
  };
}
