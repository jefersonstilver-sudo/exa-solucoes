
// Hook Principal de Checkout Unificado com Transações Únicas

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartManager } from './useCartManager';
import { useUnifiedTransaction } from './useUnifiedTransaction';
import { useEnhancedAttemptCapture } from './useEnhancedAttemptCapture';
import { useUnifiedOrderCreator } from './payment/order/useUnifiedOrderCreator';
import { useUserSession } from './useUserSession';
import { useCouponValidator } from './useCouponValidator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logSystemEvent } from '@/utils/auditLogger';

export const useUnifiedCheckout = () => {
  const navigate = useNavigate();
  const { user } = useUserSession();
  const { cartItems, selectedPlan } = useCartManager();
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-inicializar quando temos dados necessários
  useEffect(() => {
    const shouldInitialize = 
      user?.id && 
      cartItems.length > 0 && 
      selectedPlan && 
      !isInitialized && 
      !currentTransactionId &&
      !isProcessing;

    if (shouldInitialize) {
      console.log("🚀 [UnifiedCheckout] Auto-inicializando checkout unificado");
      initializeUnifiedCheckout();
    }
  }, [user?.id, cartItems.length, selectedPlan, isInitialized, currentTransactionId, isProcessing]);

  // Inicializar transação unificada
  const initializeUnifiedCheckout = async (): Promise<{ success: boolean; transactionId?: string; price?: number }> => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return { success: false };
    }

    if (cartItems.length === 0) {
      console.warn("⚠️ [UnifiedCheckout] Tentativa de inicializar com carrinho vazio");
      return { success: false };
    }

    if (!selectedPlan) {
      console.warn("⚠️ [UnifiedCheckout] Tentativa de inicializar sem plano selecionado");
      return { success: false };
    }

    if (isProcessing) {
      console.log("🔄 [UnifiedCheckout] Já está processando, ignorando nova inicialização");
      return { success: false };
    }

    setIsProcessing(true);
    setCurrentStep('session');

    try {
      console.log("🚀 [UnifiedCheckout] Inicializando checkout unificado:", {
        userId: user.id,
        cartItemsCount: cartItems.length,
        selectedPlan
      });

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
      setIsInitialized(true);

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

  // Processar pagamento PIX com integração da edge function
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

      // Chamar edge function com dados corretos
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
    setIsInitialized(false);
  };

  // Efeito para limpar na desmontagem
  useEffect(() => {
    return () => {
      // Não limpar automaticamente na desmontagem para manter estado durante navegação
    };
  }, []);

  return {
    // Estado
    currentTransactionId,
    sessionPrice,
    isProcessing,
    currentStep,
    isInitialized,

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
