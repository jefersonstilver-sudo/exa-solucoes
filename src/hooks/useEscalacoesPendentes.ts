import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useEscalacoesPendentes = () => {
  const [pendentesCount, setPendentesCount] = useState(0);
  const [phonesEscalados, setPhonesEscalados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const previousCountRef = useRef(0);

  const fetchEscalacoes = async () => {
    try {
      const result = await (supabase
        .from('escalacoes_comerciais') as any)
        .select('id, phone_number, viewed_at')
        .eq('status', 'pendente')
        .is('viewed_at', null);

      if (result.error) {
        console.error('[useEscalacoesPendentes] Error fetching:', result.error);
        return;
      }

      const data = result.data || [];
      const count = data.length;
      const phones = data.map((e: any) => e.phone_number).filter(Boolean);

      if (count > previousCountRef.current && previousCountRef.current > 0) {
        toast.info('Nova escalação comercial recebida!', {
          description: 'Um lead solicitou condições especiais',
          duration: 5000,
        });
      }

      previousCountRef.current = count;
      setPendentesCount(count);
      setPhonesEscalados(phones);
    } catch (error) {
      console.error('[useEscalacoesPendentes] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalacoes();

    const channel = supabase
      .channel('escalacoes_pendentes_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'escalacoes_comerciais'
        },
        () => {
          fetchEscalacoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { pendentesCount, phonesEscalados, loading, refetch: fetchEscalacoes };
};
