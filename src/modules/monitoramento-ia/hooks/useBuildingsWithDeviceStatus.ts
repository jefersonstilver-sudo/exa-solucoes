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
  /** Status de ciclo de vida do prédio: ativo | instalacao | inativo */
  buildingStatus: 'ativo' | 'instalacao' | 'inativo';
  /** Status bruto vindo do banco (preserva original p/ debug) */
  rawBuildingStatus?: string | null;
  onlineCount: number;
  offlineCount: number;
  totalDevices: number;
  eventsCount: number;
  provider?: string;
}

const normalizeStatus = (s?: string | null) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const getBuildingStatusKind = (s?: string | null): 'ativo' | 'instalacao' | 'inativo' => {
  const n = normalizeStatus(s);
  if (n.includes('instala')) return 'instalacao';
  if (n.includes('inativ')) return 'inativo';
  return 'ativo';
};

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

interface BuildingBase {
  id: string;
  nome: string;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  manual_latitude: number | null;
  manual_longitude: number | null;
  status?: string | null;
}

// Função para encontrar building por nome similar ao device
function findBuildingByDeviceName(deviceName: string, buildings: BuildingBase[]): BuildingBase | null {
  if (!deviceName) return null;
  
  const normalized = deviceName.toLowerCase().trim();
  
  // 1. Busca exata
  const exactMatch = buildings.find(b => 
    b.nome.toLowerCase().trim() === normalized
  );
  if (exactMatch) return exactMatch;
  
  // 2. Busca parcial - device "Provence 2" → building "Edifício Provence" ou "Provence"
  const deviceBase = normalized
    .replace(/\s*\d+$/, '') // Remove número final (ex: "2", "3")
    .replace(/^(edifício|edificio|residencial|condomínio|cond\.?)\s+/i, '') // Remove prefixos
    .trim();
  
  const partialMatch = buildings.find(b => {
    const buildingName = b.nome.toLowerCase()
      .replace(/^(edifício|edificio|residencial|condomínio|cond\.?)\s+/i, '')
      .trim();
    
    // Verifica se um contém o outro
    return buildingName.includes(deviceBase) || deviceBase.includes(buildingName);
  });
  
  if (partialMatch) return partialMatch;
  
  return null;
}

export function useBuildingsWithDeviceStatus(eventsMap?: Map<string, number>) {
  const [buildings, setBuildings] = useState<BuildingWithDeviceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estabilizar referência do eventsMap para evitar re-fetches
  const eventsMapRef = useMemo(() => eventsMap, [eventsMap?.size]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch ALL buildings (com ou sem coordenadas - vamos usar endereço depois)
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings')
        .select('id, nome, endereco, latitude, longitude, manual_latitude, manual_longitude, status');

      if (buildingsError) throw buildingsError;

      // Fetch ALL devices (não apenas os com building_id)
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('id, name, status, building_id, provider');

      if (devicesError) throw devicesError;

      // Mapear devices órfãos para buildings por nome
      const deviceToBuildingMap = new Map<string, string>(); // deviceId -> buildingId
      
      (devicesData || []).forEach(device => {
        if (device.building_id) {
          // Já tem building_id, usa direto
          deviceToBuildingMap.set(device.id, device.building_id);
        } else if (device.name) {
          // Tenta encontrar building por nome similar
          const matchedBuilding = findBuildingByDeviceName(device.name, buildingsData || []);
          if (matchedBuilding) {
            deviceToBuildingMap.set(device.id, matchedBuilding.id);
            console.log(`[useBuildingsWithDeviceStatus] Match: "${device.name}" → "${matchedBuilding.nome}"`);
          }
        }
      });

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
          // Busca devices que pertencem a este building (por building_id ou por match de nome)
          const buildingDevices = (devicesData || [])
            .filter(d => deviceToBuildingMap.get(d.id) === building.id)
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

          const buildingStatus = getBuildingStatusKind((building as any).status);

          return {
            ...building,
            devices: buildingDevices,
            status,
            buildingStatus,
            rawBuildingStatus: (building as any).status ?? null,
            onlineCount,
            offlineCount,
            totalDevices,
            eventsCount,
            provider: primaryProvider,
          };
        })
        // Mantém prédios com devices OU em instalação (mesmo sem painéis ainda)
        .filter(b => b.totalDevices > 0 || b.buildingStatus === 'instalacao');

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
