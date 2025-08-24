
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from './useUserSession';

interface OrderExistsResult {
  exists: boolean;
  pedidoId?: string;
  status?: string;
  loading: boolean;
}

export const useOrderExistsForAttempt = (attemptId?: string): OrderExistsResult => {
  const [result, setResult] = useState<OrderExistsResult>({ exists: false, loading: true });
  const { user } = useUserSession();

  useEffect(() => {
    if (!attemptId || !user?.id) {
      setResult({ exists: false, loading: false });
      return;
    }

    const checkExistingOrder = async () => {
      try {
        setResult(prev => ({ ...prev, loading: true }));

        // Verificar se existe pedido para esta tentativa
        const { data: existingOrder, error } = await supabase
          .from('pedidos')
          .select('id, status')
          .eq('source_tentativa_id', attemptId)
          .eq('client_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao verificar pedido existente:', error);
          setResult({ exists: false, loading: false });
          return;
        }

        if (existingOrder) {
          setResult({
            exists: true,
            pedidoId: existingOrder.id,
            status: existingOrder.status,
            loading: false
          });
        } else {
          setResult({ exists: false, loading: false });
        }

      } catch (error) {
        console.error('Erro ao verificar pedido existente:', error);
        setResult({ exists: false, loading: false });
      }
    };

    checkExistingOrder();
  }, [attemptId, user?.id]);

  return result;
};
