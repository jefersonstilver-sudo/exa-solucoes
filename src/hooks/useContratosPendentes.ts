import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useContratosPendentes = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const { count: totalCount, error } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .in('contrato_status', ['pendente', 'enviado']);

      if (error) {
        console.error('Erro ao buscar contratos pendentes:', error);
        return;
      }

      setCount(totalCount || 0);
    } catch (error) {
      console.error('Erro ao buscar contratos pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Realtime subscription
    const channel = supabase
      .channel('contratos-pendentes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pedidos' }, 
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading, refetch: fetchCount };
};
