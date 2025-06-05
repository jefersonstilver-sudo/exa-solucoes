
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentValidationResult {
  isValid: boolean;
  existingOrderId?: string;
  error?: string;
}

export const usePaymentValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateUniquePayment = useCallback(async (
    userId: string,
    totalAmount: number,
    cartItems: any[]
  ): Promise<PaymentValidationResult> => {
    setIsValidating(true);
    
    try {
      // Check for recent orders with same user and amount (within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: recentOrders, error } = await supabase
        .from('pedidos')
        .select('id, valor_total, created_at, status')
        .eq('client_id', userId)
        .eq('valor_total', totalAmount)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking recent orders:', error);
        return { isValid: false, error: 'Erro ao validar pagamento' };
      }

      // If there's a recent order with same amount, it's likely a duplicate
      if (recentOrders && recentOrders.length > 0) {
        const existingOrder = recentOrders[0];
        
        // If order is still pending or processing, block duplicate
        if (['pendente', 'pago', 'pago_pendente_video'].includes(existingOrder.status)) {
          return {
            isValid: false,
            existingOrderId: existingOrder.id,
            error: 'Pedido já foi processado recentemente. Evitando duplicação.'
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      console.error('Payment validation error:', error);
      return { isValid: false, error: 'Erro na validação de pagamento' };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const generateUniqueTransactionId = useCallback((userId: string, timestamp: number) => {
    return `TXN_${userId.substring(0, 8)}_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;
  }, []);

  return {
    validateUniquePayment,
    generateUniqueTransactionId,
    isValidating
  };
};
