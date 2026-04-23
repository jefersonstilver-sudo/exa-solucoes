import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Conta cadastros de síndicos com status = 'novo'.
 * Usado pelo badge do sidebar admin. Atualiza em realtime.
 */
export function useSindicosNovosCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      const { count: c } = await supabase
        .from('sindicos_interessados')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'novo');
      if (mounted) setCount(c ?? 0);
    };

    fetchCount();

    const channel = supabase
      .channel('sindicos-novos-count')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sindicos_interessados' },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { count };
}
