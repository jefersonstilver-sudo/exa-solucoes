import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEscalacoesPendentes = () => {
  const [pendentesCount, setPendentesCount] = useState(0);
  const [phonesEscalados, setPhonesEscalados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEscalacoes = async () => {
    try {
      const { data, count, error } = await supabase
        .from('escalacoes_comerciais')
        .select('id, conversation_id, phone_number', { count: 'exact' })
        .eq('status', 'pendente');

      if (error) {
        console.error('[useEscalacoesPendentes] Error:', error);
        return;
      }

      setPendentesCount(count || 0);
      
      // Extrair telefones das conversas escaladas para indicador na lista
      const phones = (data || [])
        .filter(e => e.phone_number)
        .map(e => e.phone_number as string);
      setPhonesEscalados(phones);
      
    } catch (err) {
      console.error('[useEscalacoesPendentes] Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalacoes();

    // Realtime subscription para updates automáticos
    const channel = supabase
      .channel('escalacoes-pendentes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'escalacoes_comerciais' },
        () => {
          console.log('[useEscalacoesPendentes] Realtime update detected');
          fetchEscalacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    pendentesCount, 
    phonesEscalados,
    loading,
    refetch: fetchEscalacoes 
  };
};
