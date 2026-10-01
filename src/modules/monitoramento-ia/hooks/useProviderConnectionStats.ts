import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProviderConnectionStats {
  provider: string;
  online: number;
  offline: number;
  unknown: number;
}

export interface ProviderConnection {
  id: string;
  name: string;
  building: string;
  address: string | null;
  provider: string;
  status: string | null;
  lastOnlineAt: string | null;
}

interface ProviderConnectionData {
  providers: ProviderConnectionStats[];
  connections: ProviderConnection[];
}

const QUERY_KEY = ['provider-connection-stats'];
const PAGE_SIZE = 500;

function normalizeProvider(value: string | null): string {
  const provider = value?.trim().replace(/\s+/g, ' ').toUpperCase();
  if (!provider || provider === 'SEM OPERADORA' || provider === 'SEM PROVEDOR') return 'Sem provedor';
  if (provider.replace(/\s/g, '') === 'NEWOESTE') return 'NEW OESTE';
  if (provider.replace(/\s/g, '') === 'TELECOMFOZ') return 'TELECOM FOZ';
  return provider;
}

async function fetchProviderStats(): Promise<ProviderConnectionData> {
  const stats = new Map<string, ProviderConnectionStats>();
  const connections: ProviderConnection[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('devices')
      .select('id, name, condominio_name, address, provider, status, last_online_at')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .order('id')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    for (const device of data || []) {
      const provider = normalizeProvider(device.provider);
      connections.push({
        id: device.id,
        name: device.name,
        building: device.condominio_name || device.name,
        address: device.address,
        provider,
        status: device.status,
        lastOnlineAt: device.last_online_at,
      });
      const current = stats.get(provider) || { provider, online: 0, offline: 0, unknown: 0 };
      if (device.status === 'online') current.online += 1;
      else if (device.status === 'offline') current.offline += 1;
      else current.unknown += 1;
      stats.set(provider, current);
    }

    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return {
    providers: Array.from(stats.values()).sort((a, b) =>
      (b.online + b.offline + b.unknown) - (a.online + a.offline + a.unknown) || a.provider.localeCompare(b.provider)
    ),
    connections,
  };
}

export function useProviderConnectionStats() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchProviderStats,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('provider-connection-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}