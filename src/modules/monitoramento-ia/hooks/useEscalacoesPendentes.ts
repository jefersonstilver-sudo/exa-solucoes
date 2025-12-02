import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useEscalacoesPendentes = () => {
  const [pendentesCount, setPendentesCount] = useState(0);
  const [phonesEscalados, setPhonesEscalados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const previousCountRef = useRef<number>(0);

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

      const newCount = count || 0;
      
      // Notificar se houve NOVA escalação (count aumentou)
      if (previousCountRef.current > 0 && newCount > previousCountRef.current) {
        const diff = newCount - previousCountRef.current;
        toast.warning(`🔔 ${diff} nova${diff > 1 ? 's' : ''} escalação${diff > 1 ? 'ões' : ''} comercial${diff > 1 ? 'is' : ''}!`, {
          description: 'Cliente solicitou atendimento especial',
          duration: 8000,
        });
        console.log('[useEscalacoesPendentes] 🔔 Nova escalação detectada!', { previous: previousCountRef.current, new: newCount });
      }
      
      previousCountRef.current = newCount;
      setPendentesCount(newCount);
      
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
        (payload) => {
          console.log('[useEscalacoesPendentes] 🔄 Realtime update detected:', payload.eventType);
          fetchEscalacoes();
        }
      )
      .subscribe((status) => {
        console.log('[useEscalacoesPendentes] 📡 Subscription status:', status);
      });

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
