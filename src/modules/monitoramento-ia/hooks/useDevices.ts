/**
 * Hook: useDevices
 * Gerencia polling, cache e estado dos devices
 */

import { useState, useEffect, useCallback } from 'react';
import { Device, DevicesFilters, DevicesSort, fetchDevices } from '../utils/devices';
import { POLLING_INTERVAL_MS } from '../utils/constants';
import { toast } from 'sonner';

export function useDevices(
  initialPage: number = 0,
  pageSize: number = 30,
  initialFilters?: DevicesFilters,
  initialSort?: DevicesSort
) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Auto-refresh com polling
  useEffect(() => {
    loadDevices();
    
    const interval = setInterval(() => {
      loadDevices(true); // Silent refresh
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadDevices]);

  const refresh = useCallback(() => {
    toast.info('Atualizando painéis...');
    loadDevices();
  }, [loadDevices]);

  return {
    devices,
    loading,
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
