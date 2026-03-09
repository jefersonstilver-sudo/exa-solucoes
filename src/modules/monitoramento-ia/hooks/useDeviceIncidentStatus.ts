import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type IncidentStatus = 'pendente' | 'causa_registrada' | null;

/**
 * Hook que busca em lote o status de incidentes ativos para todos os devices offline.
 * Retorna um Map<deviceId, IncidentStatus>.
 */
export function useDeviceIncidentStatus(devices: { id: string; status: string }[]) {
  const [incidentStatusMap, setIncidentStatusMap] = useState<Map<string, IncidentStatus>>(new Map());

  const offlineIds = devices.filter(d => d.status === 'offline').map(d => d.id);

  const fetchStatuses = useCallback(async () => {
    if (offlineIds.length === 0) {
      setIncidentStatusMap(new Map());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('device_offline_incidents')
        .select('device_id, status')
        .in('device_id', offlineIds)
        .is('resolved_at', null)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar status de incidentes:', error);
        return;
      }

      const map = new Map<string, IncidentStatus>();

      // Para cada device offline, pegar o incidente mais recente (primeiro no array por device)
      const seen = new Set<string>();
      for (const row of data || []) {
        if (!seen.has(row.device_id)) {
          seen.add(row.device_id);
          map.set(
            row.device_id,
            row.status === 'causa_registrada' ? 'causa_registrada' : 'pendente'
          );
        }
      }

      // Devices offline sem nenhum incidente = pendente (sem causa)
      for (const id of offlineIds) {
        if (!map.has(id)) {
          map.set(id, 'pendente');
        }
      }

      setIncidentStatusMap(map);
    } catch (err) {
      console.error('Erro crítico ao buscar incidentes:', err);
    }
  }, [offlineIds.join(',')]);

  useEffect(() => {
    fetchStatuses();

    // Polling leve a cada 30s
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  return { incidentStatusMap, refetch: fetchStatuses };
}
