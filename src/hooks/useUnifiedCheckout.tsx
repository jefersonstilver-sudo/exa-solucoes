// Hook Principal de Checkout Unificado com Transações Únicas

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckout } from './useCheckout';
import { useUnifiedTransaction } from './useUnifiedTransaction';
import { useEnhancedAttemptCapture } from './useEnhancedAttemptCapture';
import { useUnifiedOrderCreator } from './payment/order/useUnifiedOrderCreator';
import { useUserSession } from './useUserSession';
import { useCouponValidator } from './useCouponValidator';
import { useCartManager } from './useCartManager';
import { toast } from 'sonner';
import { logSystemEvent } from '@/utils/auditLogger';

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

  // Inicializar transação unificada
  const initializeUnifiedCheckout = async (): Promise<{ success: boolean; transactionId?: string; price?: number }> => {
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
      console.log("🚀 [UnifiedCheckout] Inicializando checkout unificado");

      // Passo 1: Criar sessão de transação única
      const sessionResult = await createTransactionSession(cartItems, selectedPlan);
      
      if (!sessionResult.success) {
        throw new Error("Falha ao criar sessão de transação");
      }

      console.log("✅ [UnifiedCheckout] Sessão criada:", {
        transactionId: sessionResult.transactionId,
        price: sessionResult.price
      });

      setCurrentStep('attempt');

      // Passo 2: Capturar tentativa com preço bloqueado
      const attemptResult = await captureAttempt(
        sessionResult.transactionId,
        cartItems,
        selectedPlan,
        sessionResult.price
      );

      if (!attemptResult.success) {
        throw new Error(`Falha ao capturar tentativa: ${attemptResult.error}`);
      }

      await updateTransactionStatus('tentativa_created', {
        tentativa_id: attemptResult.tentativaId
      });

      console.log("✅ [UnifiedCheckout] Tentativa capturada:", attemptResult.tentativaId);

      setCurrentStep('order');

      // Passo 3: Criar pedido unificado
      const orderResult = await createUnifiedOrder(
        sessionResult.transactionId,
        attemptResult.tentativaId!,
        cartItems,
        selectedPlan,
        sessionResult.price,
        couponId
      );

      if (!orderResult.success) {
        throw new Error(`Falha ao criar pedido: ${orderResult.error}`);
      }

      await updateTransactionStatus('pedido_created', {
        pedido_id: orderResult.pedidoId
      });

      console.log("✅ [UnifiedCheckout] Pedido criado:", orderResult.pedidoId);

      // Log final de sucesso
      logSystemEvent('UNIFIED_CHECKOUT_COMPLETED', {
        transactionId: sessionResult.transactionId,
        tentativaId: attemptResult.tentativaId,
        pedidoId: orderResult.pedidoId,
        finalPrice: sessionResult.price,
        selectedPlan,
        cartItemsCount: cartItems.length
      });

      setCurrentStep('payment');

      return {
        success: true,
        transactionId: sessionResult.transactionId,
        price: sessionResult.price
      };

    } catch (error: any) {
      console.error("❌ [UnifiedCheckout] Erro no checkout:", error);
      
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

  // CORREÇÃO: Processar pagamento PIX com integração da edge function
  const processPixPayment = async (pedidoId: string): Promise<boolean> => {
    try {
      setCurrentStep('payment');
      
      console.log("💳 [UnifiedCheckout] Processando pagamento PIX unificado:", {
        pedidoId,
        transactionId: currentTransactionId
      });

      if (!currentTransactionId) {
        throw new Error("Transaction ID não encontrado");
      }

      // Atualizar status para processamento de pagamento
      await updateTransactionStatus('payment_processing', {
        pedido_id: pedidoId
      });

      // CORREÇÃO: Chamar edge function com dados corretos
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

      console.log("✅ [UnifiedCheckout] PIX processado com sucesso:", {
        paymentId: data.pixData.paymentId,
        amount: data.amount
      });

      // Limpar carrinho após sucesso
      handleClearCart();
      
      // Navegar para página de pagamento PIX
      navigate(`/pix-payment?pedido=${pedidoId}`);

      setCurrentStep('completed');

      return true;
    } catch (error: any) {
      console.error("❌ [UnifiedCheckout] Erro no pagamento PIX:", error);
      toast.error(`Erro ao processar pagamento PIX: ${error.message}`);
      return false;
    }
  };

  // Validar integridade antes do pagamento
  const validateBeforePayment = async (expectedPrice: number): Promise<boolean> => {
    if (!currentTransactionId) {
      console.error("❌ [UnifiedCheckout] Nenhuma transação ativa");
      return false;
    }

    return await validateTransactionPrice(expectedPrice);
  };

  // Limpar checkout
  const clearUnifiedCheckout = () => {
    clearCurrentTransaction();
    setCurrentStep('session');
    setIsProcessing(false);
  };

  // Efeito para limpar na desmontagem
  useEffect(() => {
    return () => {
      if (currentStep === 'session') {
        clearUnifiedCheckout();
      }
    };
  }, []);

  return {
    // Estado
    currentTransactionId,
    sessionPrice,
    isProcessing,
    currentStep,

    // Ações principais
    initializeUnifiedCheckout,
    processPixPayment,
    validateBeforePayment,
    clearUnifiedCheckout,

    // Estado do checkout original
    cartItems,
    selectedPlan,
    couponId
  };
};
