import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SindicosStatsData {
  total: number;
  novos: number;
  emContato: number;
  aprovados: number;
}

const EM_CONTATO = ['em_contato', 'contatado', 'interessado', 'visita_agendada'];
const APROVADOS = ['aprovado', 'instalado'];

export function useSindicosStats() {
  const [stats, setStats] = useState<SindicosStatsData>({
    total: 0,
    novos: 0,
    emContato: 0,
    aprovados: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const base = () => supabase.from('sindicos_interessados').select('id', { count: 'exact', head: true });

    const [t, n, e, a] = await Promise.all([
      base(),
      base().eq('status', 'novo'),
      base().in('status', EM_CONTATO),
      base().in('status', APROVADOS),
    ]);

    setStats({
      total: t.count ?? 0,
      novos: n.count ?? 0,
      emContato: e.count ?? 0,
      aprovados: a.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel('sindicos-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sindicos_interessados' },
        () => fetchStats()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
