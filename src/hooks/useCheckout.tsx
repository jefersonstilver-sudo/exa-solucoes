import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useCartManager } from '@/hooks/useCartManager';
import { useCouponValidator } from '@/hooks/useCouponValidator';
import { usePanelAvailability } from '@/hooks/usePanelAvailability';
import { usePaymentProcessor } from '@/hooks/payment/usePaymentProcessor';
import { useAttemptCapture } from '@/hooks/useAttemptCapture';
import { calculateTotalPrice, calculateCartSubtotal, validatePriceIntegrity } from '@/utils/checkoutUtils';
import { CHECKOUT_STEPS, PLANS } from '@/constants/checkoutConstants';
import { useCheckoutState } from '@/hooks/checkout/useCheckoutState';
import { useCheckoutAuth } from '@/hooks/checkout/useCheckoutAuth';
import { useCheckoutNavigation } from '@/hooks/checkout/useCheckoutNavigation';
import { CheckoutSteps, Plan, PlanKey } from '@/types/checkout';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { PaymentResponse } from '@/types/payment';
import { useCart } from '@/contexts/SimpleCartContext';
import { logPriceCalculation } from '@/utils/auditLogger';
import { duplicateOrderPrevention } from '@/utils/duplicateOrderPrevention';
import { transactionRecoveryManager } from '@/utils/transactionRecoveryManager';

export const STEPS = CHECKOUT_STEPS;
export { PLANS };

export const useCheckout = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const orderId = searchParams.get('id');
  
  // CORREÇÃO: Usar cartItems do contexto correto diretamente
  const { cartItems } = useCart();
  const { handleClearCart } = useCartManager();
  const { captureAttempt, clearAttempt } = useAttemptCapture();
  
  const {
    step, setStep,
    selectedPlan, setSelectedPlan,
    acceptTerms, setAcceptTerms,
    startDate, endDate,
    sessionUser, setSessionUser,
    STEPS
  } = useCheckoutState();

  const {
    couponCode, setCouponCode,
    couponDiscount, couponId,
    isValidatingCoupon, couponMessage,
    couponValid, validateCoupon
  } = useCouponValidator();
  
  const {
    isCheckingAvailability,
    unavailablePanels,
    checkPanelAvailability
  } = usePanelAvailability();
  
  const {
    isCreatingPayment,
    createPayment,
    paymentMethod,
    setPaymentMethod
  } = usePaymentProcessor();

  // Log crítico para confirmar que este hook está usando a configuração correta
  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `useCheckout: SISTEMA CORRIGIDO COM INTEGRIDADE - Hook inicializado`,
      { 
        currentPath: location.pathname,
        webhookUrl: "https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19",
        timestamp: new Date().toISOString()
      }
    );

    // Iniciar monitoramento de recuperação automática
    transactionRecoveryManager.monitorRealtimeTransactions();
  }, []); // Run only once

  // Hook de autenticação - executado apenas uma vez
  useCheckoutAuth(setSessionUser);
  
  // Hook de validação do carrinho - com debounce
  const debouncedCartValidation = useCallback(() => {
    if (cartItems.length > 0) {
      console.log(`[useCheckout] Cart validated: ${cartItems.length} items`);
      
      // Log detalhado dos itens do carrinho para auditoria
      console.log("🛒 [useCheckout] AUDITORIA DO CARRINHO:", {
        itemCount: cartItems.length,
        items: cartItems.map(item => ({
          panelId: item.panel.id,
          buildingName: item.panel.buildings?.nome,
          preco_base: item.panel.buildings?.preco_base,
          duration: item.duration,
          price: item.price
        })),
        timestamp: new Date().toISOString()
      });
    }
  }, [cartItems]);

  useEffect(() => {
    const timeout = setTimeout(debouncedCartValidation, 500);
    return () => clearTimeout(timeout);
  }, [debouncedCartValidation]);

  // CORREÇÃO CRÍTICA: calculateTotalPrice sempre recalcula com dados atuais
  const calculateCurrentTotalPrice = useCallback(() => {
    if (!selectedPlan || cartItems.length === 0) {
      console.log("💰 [useCheckout] Cálculo cancelado - dados insuficientes:", {
        selectedPlan,
        cartItemsLength: cartItems.length
      });
      return 0;
    }

    const result = calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
    
    console.log("💰 [useCheckout] TOTAL RECALCULADO COM SISTEMA DE INTEGRIDADE:", {
      selectedPlan,
      cartItemsCount: cartItems.length,
      couponDiscount,
      couponValid,
      orderTotal: result,
      currentPath: location.pathname,
      timestamp: new Date().toISOString(),
      cartDetails: cartItems.map(item => ({
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        preco_base: item.panel.buildings?.preco_base
      }))
    });

    // Validar integridade antes de retornar
    if (result <= 0) {
      console.error("❌ [useCheckout] PREÇO INVÁLIDO DETECTADO:", {
        result,
        selectedPlan,
        cartItemsCount: cartItems.length
      });
    }

    return result;
  }, [selectedPlan, cartItems, couponDiscount, couponValid, location.pathname]);

  // USAR AS FUNÇÕES CENTRALIZADAS para garantir consistência
  const orderTotal = useMemo(() => {
    return calculateCurrentTotalPrice();
  }, [calculateCurrentTotalPrice]);

  const cartSubtotal = useMemo(() => {
    const result = calculateCartSubtotal(cartItems);
    
    console.log("💰 [useCheckout] SUBTOTAL CALCULADO:", {
      cartItemsCount: cartItems.length,
      cartSubtotal: result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }, [cartItems]);

  // Função wrapper para createPayment - com validação robusta e prevenção de duplicação
  const wrappedCreatePayment = useCallback(async (options: any): Promise<any> => {
    try {
      if (!sessionUser?.id) {
        throw new Error("Usuário não autenticado");
      }

      if (cartItems.length === 0) {
        throw new Error("Carrinho vazio");
      }

      const currentTotal = calculateCurrentTotalPrice();
      
      // NOVA VALIDAÇÃO: Verificar duplicação
      if (duplicateOrderPrevention.isDuplicateAttempt(sessionUser.id, currentTotal, cartItems)) {
        throw new Error("Tentativa de pedido duplicado detectada. Aguarde alguns minutos antes de tentar novamente.");
      }

      // NOVA VALIDAÇÃO: Adquirir lock de processamento
      if (!duplicateOrderPrevention.acquireProcessingLock(sessionUser.id, currentTotal)) {
        throw new Error("Processamento já em andamento. Aguarde.");
      }

      try {
        // Registrar tentativa
        const sessionId = duplicateOrderPrevention.registerAttempt(sessionUser.id, currentTotal, cartItems);
        
        console.log('[useCheckout] SISTEMA CORRIGIDO - Creating payment with validated data:', {
          userId: sessionUser.id,
          amount: currentTotal,
          sessionId
        });
        
        // Validar integridade do preço antes do pagamento
        const integrityCheck = validatePriceIntegrity(selectedPlan!, cartItems, currentTotal);
        if (!integrityCheck.isValid) {
          console.error("❌ [useCheckout] FALHA NA VALIDAÇÃO DE INTEGRIDADE:", integrityCheck);
          throw new Error(`Inconsistência de preço detectada. Diferença: R$ ${integrityCheck.difference.toFixed(2)}`);
        }
        
        const response = await createPayment({
          ...options,
          totalPrice: currentTotal, // Garantir que o preço correto seja usado
          sessionId
        });
        
        if (response && response.success) {
          await clearAttempt(sessionUser.id);
        }
        
        return response;
      } finally {
        // Sempre liberar o lock
        duplicateOrderPrevention.releaseProcessingLock(sessionUser.id, currentTotal);
      }
      
    } catch (error) {
      console.error('[useCheckout] Payment error:', error);
      throw error;
    }
  }, [createPayment, sessionUser?.id, cartItems, calculateCurrentTotalPrice, selectedPlan, clearAttempt]);

  // Usa o hook de navegação - com validações melhoradas
  const navigation = useCheckoutNavigation({
    step,
    setStep,
    selectedPlan,
    cartItems,
    couponDiscount,
    couponValid,
    acceptTerms,
    unavailablePanels,
    couponId,
    startDate,
    endDate,
    sessionUser,
    handleClearCart,
    createPayment: wrappedCreatePayment
  });

  // Set step baseado na rota - corrigido para nova ordem
  const currentPath = location.pathname;
  useEffect(() => {
    if (currentPath === '/selecionar-plano') {
      setStep(0);
    } else if (currentPath === '/checkout/cupom') {
      setStep(1);
    } else if (currentPath === '/checkout/resumo') {
      setStep(2);
    } else if (currentPath === '/checkout') {
      setStep(3);
    } else if (currentPath === '/checkout/finalizar') {
      setStep(4);
    } else if (currentPath.startsWith('/pix-payment')) {
      setStep(3);
    }
  }, [currentPath, setStep]);

  // Carrega plano do localStorage - apenas uma vez
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('selectedPlan');
      if (savedPlan) {
        const parsedPlan = parseInt(savedPlan);
        if ([1, 3, 6, 12].includes(parsedPlan)) {
          setSelectedPlan(parsedPlan as PlanKey);
        }
      }
    } catch (error) {
      console.error('[useCheckout] Erro ao carregar plano:', error);
    }
  }, []);
  
  // Verifica disponibilidade dos painéis - apenas quando necessário
  useEffect(() => {
    if (step === 2 && cartItems.length > 0) {
      const timeout = setTimeout(() => {
        checkPanelAvailability(cartItems, startDate, endDate);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [step, cartItems.length, startDate, endDate]);

  // NOVA FUNCIONALIDADE: Capturar tentativa quando usuário chega no checkout
  useEffect(() => {
    const shouldCaptureAttempt = 
      sessionUser?.id && 
      cartItems.length > 0 && 
      selectedPlan &&
      (step === 2 || step === 3); // Resumo ou pagamento
    
    if (shouldCaptureAttempt) {
      const totalPrice = calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
      
      console.log("📊 [useCheckout] CAPTURANDO TENTATIVA COM PREÇOS CORRETOS:", {
        userId: sessionUser.id,
        cartItemsCount: cartItems.length,
        selectedPlan,
        totalPrice,
        step,
        timestamp: new Date().toISOString()
      });
      
      const timeout = setTimeout(() => {
        captureAttempt(sessionUser.id, cartItems, totalPrice);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [sessionUser?.id, cartItems.length, selectedPlan, step, couponDiscount, couponValid]);

  return {
    step,
    STEPS,
    selectedPlan,
    setSelectedPlan,
    couponCode,
    setCouponCode,
    couponDiscount,
    couponMessage,
    couponValid,
    isValidatingCoupon,
    acceptTerms,
    setAcceptTerms,
    startDate,
    endDate,
    isCreatingPayment,
    isNavigating: navigation.isNavigating,
    unavailablePanels,
    cartItems,
    validateCoupon,
    handleNextStep: navigation.handleNextStep,
    handlePrevStep: navigation.handlePrevStep,
    isNextEnabled: navigation.isNextEnabled,
    PLANS,
    calculateTotalPrice: calculateCurrentTotalPrice, // CORREÇÃO: sempre recalcula em tempo real
    calculateCartSubtotal: () => cartSubtotal,
    orderId,
    paymentMethod,
    setPaymentMethod
  };
};
