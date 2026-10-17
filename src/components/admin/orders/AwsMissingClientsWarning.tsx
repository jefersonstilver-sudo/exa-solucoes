import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  buildingIds: string[];
}

interface Presence {
  building_id: string;
  client_id: string;
  presence: 'exists' | 'missing' | 'unknown';
}

/** Warns when a building of the order has no client registered on the AWS player API. */
export function AwsMissingClientsWarning({ buildingIds }: Props) {
  const [missing, setMissing] = useState<Presence[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const key = [...new Set(buildingIds)].sort().join(',');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    (async () => {
      const ids = key.split(',');
      const { data, error } = await supabase.functions.invoke('master-video-daily-check', {
        body: { action: 'check_clients', building_ids: ids },
      });
      if (cancelled || error || !data?.success) return;
      const miss = ((data.buildings || []) as Presence[]).filter((b) => b.presence === 'missing');
      setMissing(miss);
      if (miss.length > 0) {
        const { data: rows } = await supabase.from('buildings').select('id, nome').in('id', miss.map((m) => m.building_id));
        if (!cancelled) setNames(Object.fromEntries((rows || []).map((r: any) => [r.id, r.nome])));
      }
    })();
    return () => { cancelled = true; };
  }, [key]);

  if (missing.length === 0) return null;
  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-5 mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
      <div className="flex items-center gap-2 font-semibold text-xs">
        <AlertTriangle className="h-4 w-4" />
        {missing.length} prédio(s) deste pedido não têm cliente na AWS — os vídeos não chegam nessas telas
      </div>
      <ul className="mt-1.5 space-y-0.5 text-[11px]">
        {missing.map((m) => (
          <li key={m.building_id}>
            {names[m.building_id] || 'Prédio'} <span className="font-mono text-amber-700">({m.building_id.slice(0, 8)} · cliente {m.client_id})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
