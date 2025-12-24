import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBeneficiosAcaoNecessaria = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      // Benefícios que já tiveram escolha feita mas ainda não receberam o gift_code
      const { count: totalCount, error } = await supabase
        .from('provider_benefits')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'choice_made')
        .is('gift_code', null);

      if (error) {
        console.error('Erro ao buscar benefícios com ação necessária:', error);
        return;
      }

      setCount(totalCount || 0);
    } catch (error) {
      console.error('Erro ao buscar benefícios com ação necessária:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Realtime subscription
    const channel = supabase
      .channel('beneficios-acao-necessaria')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'provider_benefits' }, 
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading, refetch: fetchCount };
};
