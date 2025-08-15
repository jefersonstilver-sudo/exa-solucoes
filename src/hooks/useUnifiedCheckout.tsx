
// Hook Principal de Checkout Unificado - Versão Limpa

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckout } from './useCheckout';
import { useUnifiedTransaction } from './useUnifiedTransaction';
import { useEnhancedAttemptCapture } from './useEnhancedAttemptCapture';
import { useUnifiedOrderCreator } from './payment/order/useUnifiedOrderCreator';
import { useUserSession } from './useUserSession';
import { useCouponValidator } from './useCouponValidator';
import { useCartManager } from './useCartManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logSystemEvent } from '@/utils/auditLogger';
import { PlanKey } from '@/types/checkout';

export const useUnifiedCheckout = () => {
  const navigate = useNavigate();
  const { user } = useUserSession();
  const { cartItems, selectedPlan } = useCheckout();
  const { couponId } = useCouponValidator();
  const { handleClearCart } = useCartManager();

  const {
    currentTransactionId,
    sessionPrice,
    createTransactionSession,
    updateTransactionStatus,
    validateTransactionPrice,
    clearCurrentTransaction
  } = useUnifiedTransaction();

  const { captureAttempt } = useEnhancedAttemptCapture();
  const { createUnifiedOrder } = useUnifiedOrderCreator();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'session' | 'attempt' | 'order' | 'payment' | 'completed'>('session');

  const initializeUnifiedCheckout = async (): Promise<{ success: boolean; transactionId?: string; price?: number; pedidoId?: string }> => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return { success: false };
    }

    if (cartItems.length === 0) {
      toast.error("Carrinho vazio");
      return { success: false };
    }

    if (!selectedPlan) {
      toast.error("Plano não selecionado");
      return { success: false };
    }

    setIsProcessing(true);
    setCurrentStep('session');

    try {
      const planKey = selectedPlan as PlanKey;
      
      // Passo 1: Criar sessão de transação única
      const sessionResult = await createTransactionSession(cartItems, planKey);
      
      if (!sessionResult.success) {
        throw new Error("Falha ao criar sessão de transação");
      }

      setCurrentStep('attempt');

      // Passo 2: Capturar tentativa com preço bloqueado
      const attemptResult = await captureAttempt(
        sessionResult.transactionId,
        cartItems,
        planKey,
        sessionResult.price
      );

      if (!attemptResult.success) {
        throw new Error(`Falha ao capturar tentativa: ${attemptResult.error}`);
      }

      await updateTransactionStatus('tentativa_created', {
        tentativa_id: attemptResult.tentativaId
      });

      setCurrentStep('order');

      // Passo 3: Criar pedido unificado
      const orderResult = await createUnifiedOrder(
        sessionResult.transactionId,
        attemptResult.tentativaId!,
        cartItems,
        planKey,
        sessionResult.price,
        couponId
      );

      if (!orderResult.success) {
        throw new Error(`Falha ao criar pedido: ${orderResult.error}`);
      }

      await updateTransactionStatus('pedido_created', {
        pedido_id: orderResult.pedidoId
      });

      // Log final de sucesso
      logSystemEvent('UNIFIED_CHECKOUT_COMPLETED', {
        transactionId: sessionResult.transactionId,
        tentativaId: attemptResult.tentativaId,
        pedidoId: orderResult.pedidoId,
        finalPrice: sessionResult.price,
        selectedPlan: planKey,
        cartItemsCount: cartItems.length
      });

      setCurrentStep('payment');

      return {
        success: true,
        transactionId: sessionResult.transactionId,
        price: sessionResult.price,
        pedidoId: orderResult.pedidoId
      };

    } catch (error: any) {
      logSystemEvent('UNIFIED_CHECKOUT_ERROR', {
        error: error.message,
        currentStep,
        userId: user.id,
        cartItemsCount: cartItems.length
      }, 'ERROR');

      toast.error(`Erro no checkout: ${error.message}`);
      
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  const processPixPayment = async (pedidoId: string): Promise<boolean> => {
    try {
      setCurrentStep('payment');
      
      if (!currentTransactionId) {
        throw new Error("Transaction ID não encontrado");
      }

      await updateTransactionStatus('payment_processing', {
        pedido_id: pedidoId
      });

      const { data, error } = await supabase.functions.invoke('process-pix-payment', {
        body: {
          transactionId: currentTransactionId,
          pedidoId: pedidoId
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha ao processar pagamento PIX');
      }

      handleClearCart();
      navigate(`/pix-payment?pedido=${pedidoId}`);
      setCurrentStep('completed');

      return true;
    } catch (error: any) {
      toast.error(`Erro ao processar pagamento PIX: ${error.message}`);
      return false;
    }
  };

  const validateBeforePayment = async (expectedPrice: number): Promise<boolean> => {
    if (!currentTransactionId) {
      return false;
    }

    return await validateTransactionPrice(expectedPrice);
  };

  const clearUnifiedCheckout = () => {
    clearCurrentTransaction();
    setCurrentStep('session');
    setIsProcessing(false);
  };

  useEffect(() => {
    return () => {
      if (currentStep === 'session') {
        clearUnifiedCheckout();
      }
    };
  }, []);

  return {
    currentTransactionId,
    sessionPrice,
    isProcessing,
    currentStep,
    initializeUnifiedCheckout,
    processPixPayment,
    validateBeforePayment,
    clearUnifiedCheckout,
    cartItems,
    selectedPlan,
    couponId
  };
};
