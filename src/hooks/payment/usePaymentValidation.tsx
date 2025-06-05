
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export const usePaymentValidation = () => {
  
  const validateUniquePayment = useCallback(async (userId: string, amount: number, cartItems: any[]) => {
    try {
      console.log('[PAYMENT-VALIDATION] Iniciando validação anti-duplicação REFORÇADA:', {
        userId: userId.substring(0, 8),
        amount,
        cartItemsCount: cartItems.length
      });

      // CRÍTICO: Verificar se já existe um pedido com valor exato nos últimos 10 minutos
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: recentOrders, error } = await supabase
        .from('pedidos')
        .select('id, created_at, valor_total, status')
        .eq('client_id', userId)
        .eq('valor_total', amount)
        .gte('created_at', tenMinutesAgo)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PAYMENT-VALIDATION] Erro na validação:', error);
        return {
          isValid: false,
          error: 'Erro na validação de pagamento',
          existingOrderId: null
        };
      }

      // Se encontrou pedidos recentes com mesmo valor
      if (recentOrders && recentOrders.length > 0) {
        const existingOrder = recentOrders[0];
        
        console.log('[PAYMENT-VALIDATION] DUPLICAÇÃO DETECTADA:', {
          existingOrderId: existingOrder.id,
          existingAmount: existingOrder.valor_total,
          newAmount: amount,
          timeDifferenceMinutes: (Date.now() - new Date(existingOrder.created_at).getTime()) / (1000 * 60)
        });

        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.ERROR,
          'Tentativa de pagamento duplicado bloqueada',
          {
            userId,
            amount,
            existingOrderId: existingOrder.id,
            existingAmount: existingOrder.valor_total
          }
        );

        return {
          isValid: false,
          error: 'Já existe um pedido recente com este valor. Aguarde alguns minutos antes de tentar novamente.',
          existingOrderId: existingOrder.id
        };
      }

      // CRÍTICO: Verificar valor mínimo válido
      if (amount <= 0 || amount < 0.01) {
        console.log('[PAYMENT-VALIDATION] Valor inválido detectado:', amount);
        
        return {
          isValid: false,
          error: 'Valor de pagamento inválido',
          existingOrderId: null
        };
      }

      // CRÍTICO: Verificar se o valor não foi dividido incorretamente
      const expectedMinimumValue = cartItems.length * 0.10; // Valor mínimo esperado baseado nos itens
      if (amount < expectedMinimumValue) {
        console.log('[PAYMENT-VALIDATION] Valor suspeito (possivelmente dividido):', {
          amount,
          expectedMinimum: expectedMinimumValue,
          cartItemsCount: cartItems.length
        });

        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.WARNING,
          'Valor de pagamento suspeito detectado',
          {
            amount,
            expectedMinimum: expectedMinimumValue,
            cartItemsCount: cartItems.length
          }
        );
      }

      console.log('[PAYMENT-VALIDATION] ✅ Validação aprovada');
      
      return {
        isValid: true,
        error: null,
        existingOrderId: null
      };

    } catch (error: any) {
      console.error('[PAYMENT-VALIDATION] Erro na validação:', error);
      
      return {
        isValid: false,
        error: 'Erro interno na validação de pagamento',
        existingOrderId: null
      };
    }
  }, []);

  const generateUniqueTransactionId = useCallback((userId: string, timestamp: number) => {
    // Gerar ID único com timestamp e user ID
    const uniquePart = Math.random().toString(36).substring(2, 8);
    return `TXN_${userId.substring(0, 8)}_${timestamp}_${uniquePart}`;
  }, []);

  const validatePaymentAmount = useCallback((amount: number, cartItems: any[]) => {
    // Validar se o valor não foi dividido incorretamente
    const minExpectedValue = cartItems.length * 0.05; // Valor mínimo por item
    const maxExpectedValue = cartItems.length * 1000; // Valor máximo por item
    
    if (amount < minExpectedValue) {
      return {
        isValid: false,
        error: 'Valor muito baixo para os itens selecionados',
        suggestedValue: minExpectedValue
      };
    }
    
    if (amount > maxExpectedValue) {
      return {
        isValid: false,
        error: 'Valor muito alto para os itens selecionados',
        suggestedValue: maxExpectedValue
      };
    }
    
    return {
      isValid: true,
      error: null,
      suggestedValue: amount
    };
  }, []);

  // Implementar o método que estava faltando
  const validatePaymentRequirements = useCallback(({
    acceptTerms,
    unavailablePanels,
    sessionUser,
    isSDKLoaded,
    cartItems
  }: {
    acceptTerms: boolean;
    unavailablePanels: string[];
    sessionUser: any;
    isSDKLoaded: boolean;
    cartItems: any[];
  }) => {
    // Verificar termos aceitos
    if (!acceptTerms) {
      return false;
    }

    // Verificar se o usuário está logado
    if (!sessionUser || !sessionUser.id) {
      return false;
    }

    // Verificar se há itens no carrinho
    if (!cartItems || cartItems.length === 0) {
      return false;
    }

    // Verificar se o SDK está carregado (se necessário)
    if (!isSDKLoaded) {
      console.warn('[PAYMENT-VALIDATION] SDK não carregado, mas permitindo prosseguir');
    }

    return true;
  }, []);

  return {
    validateUniquePayment,
    generateUniqueTransactionId,
    validatePaymentAmount,
    validatePaymentRequirements
  };
};
