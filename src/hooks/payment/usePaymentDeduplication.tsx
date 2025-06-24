
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePaymentDeduplication = () => {
  
  const cleanupDuplicateOrders = useCallback(async (userId: string) => {
    try {
      // Find potential duplicate orders (same user, same amount, created within 5 minutes)
      const { data: orders, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userId)
        .order('created_at', { ascending: false });

      if (error || !orders) {
        console.error('Error fetching orders for cleanup:', error);
        return;
      }

      const duplicateGroups: { [key: string]: any[] } = {};
      
      // Group orders by amount and time proximity
      orders.forEach(order => {
        const key = `${order.valor_total}_${Math.floor(new Date(order.created_at).getTime() / (5 * 60 * 1000))}`;
        if (!duplicateGroups[key]) {
          duplicateGroups[key] = [];
        }
        duplicateGroups[key].push(order);
      });

      // Remove duplicates, keeping the first (oldest) order in each group
      for (const [key, groupOrders] of Object.entries(duplicateGroups)) {
        if (groupOrders.length > 1) {
          // Keep the first order, delete the rest
          const ordersToDelete = groupOrders.slice(1);
          
          for (const orderToDelete of ordersToDelete) {
            const { error: deleteError } = await supabase
              .from('pedidos')
              .delete()
              .eq('id', orderToDelete.id);
              
            if (deleteError) {
              console.error('Error deleting duplicate order:', deleteError);
            } else {
              console.log(`Deleted duplicate order: ${orderToDelete.id}`);
            }
          }
        }
      }

      // Also cleanup tentativas_compra that might be orphaned
      const { error: cleanupError } = await supabase
        .from('tentativas_compra')
        .delete()
        .eq('id_user', userId)
        .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Older than 10 minutes

      if (cleanupError) {
        console.error('Error cleaning up attempts:', cleanupError);
      }

    } catch (error) {
      console.error('Error in cleanup process:', error);
    }
  }, []);

  const preventDuplicateSubmission = useCallback(() => {
    const submissionKey = `payment_submission_${Date.now()}`;
    const lastSubmission = localStorage.getItem('last_payment_submission');
    const now = Date.now();
    
    if (lastSubmission) {
      const timeDiff = now - parseInt(lastSubmission);
      if (timeDiff < 15000) { // INCREASED: Prevent submissions within 15 seconds
        toast.error('Aguarde alguns segundos antes de tentar novamente');
        return false;
      }
    }
    
    localStorage.setItem('last_payment_submission', now.toString());
    return true;
  }, []);

  const createUniquePaymentKey = useCallback((userId: string, amount: number) => {
    // Create a unique key based on user, amount, and current minute
    const currentMinute = Math.floor(Date.now() / (60 * 1000));
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `PAYMENT_${userId}_${amount}_${currentMinute}_${randomSuffix}`;
  }, []);

  const validatePaymentIntegrity = useCallback(async (userId: string, amount: number) => {
    try {
      // CRÍTICO: Verificar se há pagamentos recentes suspeitos
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: recentPayments, error } = await supabase
        .from('pedidos')
        .select('id, valor_total, created_at')
        .eq('client_id', userId)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro na validação de integridade:', error);
        return { isValid: false, reason: 'Erro na validação' };
      }

      // Verificar duplicações por valor
      const duplicatesByValue = recentPayments?.filter(p => p.valor_total === amount) || [];
      if (duplicatesByValue.length > 0) {
        console.log('🚨 DUPLICAÇÃO POR VALOR DETECTADA:', {
          userId: userId.substring(0, 8),
          amount,
          existingPayments: duplicatesByValue.length
        });
        
        return { 
          isValid: false, 
          reason: 'Pagamento duplicado por valor detectado',
          existingPayments: duplicatesByValue
        };
      }

      // Verificar múltiplos pagamentos no mesmo minuto
      const currentMinute = Math.floor(Date.now() / (60 * 1000));
      const sameMinutePayments = recentPayments?.filter(p => {
        const paymentMinute = Math.floor(new Date(p.created_at).getTime() / (60 * 1000));
        return paymentMinute === currentMinute;
      }) || [];

      if (sameMinutePayments.length > 0) {
        console.log('🚨 MÚLTIPLOS PAGAMENTOS NO MESMO MINUTO:', {
          userId: userId.substring(0, 8),
          currentMinute,
          existingPayments: sameMinutePayments.length
        });
        
        return { 
          isValid: false, 
          reason: 'Múltiplos pagamentos no mesmo minuto detectados',
          existingPayments: sameMinutePayments
        };
      }

      return { isValid: true, reason: 'Validação aprovada' };

    } catch (error) {
      console.error('Erro na validação de integridade:', error);
      return { isValid: false, reason: 'Erro interno na validação' };
    }
  }, []);

  return {
    cleanupDuplicateOrders,
    preventDuplicateSubmission,
    createUniquePaymentKey,
    validatePaymentIntegrity
  };
};
