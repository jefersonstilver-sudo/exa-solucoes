/**
 * Hook: useDevices
 * Gerencia polling, cache e estado dos devices
 */

import { useState, useEffect, useCallback } from 'react';
import { Device, DevicesFilters, DevicesSort, fetchDevices } from '../utils/devices';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Auto-refresh a cada 15 segundos (reduzido para evitar oscilações de status)
const POLLING_INTERVAL_MS = 15000;

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

  // Mostra a lista na hora e sincroniza o AnyDesk em segundo plano (antes a página esperava a sincronização terminar)
  useEffect(() => {
    let ativo = true;
    loadDevices(false);
    setSyncing(true);
    supabase.functions.invoke('sync-anydesk', { body: { force: true, triggered_by: 'page_mount' } })
      .catch((err) => console.error('[DEVICES] sync-anydesk', err))
      .finally(() => { if (ativo) { setSyncing(false); loadDevices(true); } });
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
