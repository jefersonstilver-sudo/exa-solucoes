/**
 * Hook: useDevices
 * Gerencia polling, cache e estado dos devices
 */

import { useState, useEffect, useCallback } from 'react';
import { Device, DevicesFilters, DevicesSort, fetchDevices } from '../utils/devices';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Auto-refresh a cada 4 segundos
const POLLING_INTERVAL_MS = 4000;

export function useDevices(
  initialPage: number = 0,
  pageSize: number = 30,
  initialFilters?: DevicesFilters,
  initialSort?: DevicesSort
) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<DevicesFilters>(initialFilters || {});
  const [sort, setSort] = useState<DevicesSort>(
    initialSort || { field: 'name', order: 'asc' }
  );

  const loadDevices = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const { devices: data, total: totalCount } = await fetchDevices(
        page,
        pageSize,
        filters,
        sort
      );
      setDevices(data);
      setTotal(totalCount);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar devices:', error);
      if (!silent) {
        toast.error('Erro ao carregar painéis');
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, sort]);

  // Forçar sincronização ao montar o componente
  useEffect(() => {
    const forceSyncOnMount = async () => {
      console.log('🔄 [DEVICES] Forçando sincronização ao abrir página...');
      setSyncing(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('sync-anydesk', {
          body: { force: true, triggered_by: 'page_mount' }
        });
        
        if (error) {
          console.error('❌ [DEVICES] Erro ao forçar sincronização:', error);
        } else {
          console.log('✅ [DEVICES] Sincronização forçada concluída:', data);
        }
      } catch (err) {
        console.error('❌ [DEVICES] Erro crítico ao sincronizar:', err);
      } finally {
        setSyncing(false);
        await loadDevices(false);
      }
    };

    forceSyncOnMount();
  }, []); // Apenas ao montar

  // Auto-refresh com polling
  useEffect(() => {
    if (lastUpdate.getTime() !== new Date().getTime()) {
      const interval = setInterval(() => {
        loadDevices(true); // Silent refresh
      }, POLLING_INTERVAL_MS);

      return () => clearInterval(interval);
    }
  }, [loadDevices, lastUpdate]);

  const refresh = useCallback(() => {
    toast.info('Atualizando painéis...');
    loadDevices();
  }, [loadDevices]);

  return {
    devices,
    loading,
    syncing,
    lastUpdate,
    page,
    setPage,
    total,
    filters,
    setFilters,
    sort,
    setSort,
    refresh,
  };
}
