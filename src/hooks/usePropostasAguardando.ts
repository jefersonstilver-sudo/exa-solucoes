import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePropostasAguardando = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const { count: totalCount, error } = await supabase
        .from('proposals')
        .select('id', { count: 'exact', head: true })
        .in('status', ['enviada', 'atualizada', 'visualizada']);

      if (error) {
        console.error('Erro ao buscar propostas aguardando:', error);
        return;
      }

      setCount(totalCount || 0);
    } catch (error) {
      console.error('Erro ao buscar propostas aguardando:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Realtime subscription
    const channel = supabase
      .channel('propostas-aguardando')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'proposals' }, 
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading, refetch: fetchCount };
};
