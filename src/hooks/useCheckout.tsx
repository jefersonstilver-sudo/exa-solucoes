
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useCartManager } from '@/hooks/useCartManager';
import { useCouponValidator } from '@/hooks/useCouponValidator';
import { usePanelAvailability } from '@/hooks/usePanelAvailability';
import { usePaymentProcessor } from '@/hooks/payment/usePaymentProcessor';
import { useAttemptCapture } from '@/hooks/useAttemptCapture';
import { calculateTotalPrice, calculateCartSubtotal } from '@/utils/checkoutUtils';
import { CHECKOUT_STEPS, PLANS } from '@/constants/checkoutConstants';
import { useCheckoutState } from '@/hooks/checkout/useCheckoutState';
import { useCheckoutAuth } from '@/hooks/checkout/useCheckoutAuth';
import { useCartValidation } from '@/hooks/checkout/useCartValidation';
import { useCheckoutNavigation } from '@/hooks/checkout/useCheckoutNavigation';
import { CheckoutSteps, Plan, PlanKey } from '@/types/checkout';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { PaymentResponse } from '@/types/payment';

export const STEPS = CHECKOUT_STEPS;
export { PLANS };

export const useCheckout = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const orderId = searchParams.get('id');
  
  const { cartItems, handleClearCart } = useCartManager();
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
      `useCheckout: SISTEMA CORRIGIDO - Hook inicializado com cálculos unificados`,
      { 
        currentPath: location.pathname,
        webhookUrl: "https://stilver.app.n8n.cloud/webhook/d8e707ae-093a-4e08-9069-8627eb9c1d19",
        timestamp: new Date().toISOString()
      }
    );
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

  // USAR AS FUNÇÕES CENTRALIZADAS para garantir consistência
  const orderTotal = useMemo(() => {
    const result = calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
    
    console.log("💰 [useCheckout] TOTAL CALCULADO:", {
      selectedPlan,
      cartItemsCount: cartItems.length,
      couponDiscount,
      couponValid,
      orderTotal: result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }, [selectedPlan, cartItems, couponDiscount, couponValid]);

  const cartSubtotal = useMemo(() => {
    const result = calculateCartSubtotal(cartItems);
    
    console.log("💰 [useCheckout] SUBTOTAL CALCULADO:", {
      cartItemsCount: cartItems.length,
      cartSubtotal: result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }, [cartItems]);

  // Função wrapper para createPayment - com validação robusta
  const wrappedCreatePayment = useCallback(async (options: any): Promise<any> => {
    try {
      if (!sessionUser?.id) {
        throw new Error("Usuário não autenticado");
      }

      if (cartItems.length === 0) {
        throw new Error("Carrinho vazio");
      }

      console.log('[useCheckout] SISTEMA CORRIGIDO - Creating payment with valid user:', sessionUser.id);
      console.log('[useCheckout] CONFIRMAÇÃO: Usando cálculos unificados no createPayment');
      
      const response = await createPayment(options);
      
      if (response && response.success) {
        await clearAttempt(sessionUser.id);
      }
      
      return response;
    } catch (error) {
      console.error('[useCheckout] Payment error:', error);
      throw error;
    }
  }, [createPayment, sessionUser?.id, cartItems.length, clearAttempt]);

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

  // Adaptação da função validateCoupon - com debounce
  const handleValidateCoupon = useCallback(() => {
    if (couponCode.trim()) {
      validateCoupon(couponCode, selectedPlan);
    }
  }, [couponCode, selectedPlan, validateCoupon]);

  // Handler para próximo step com payment method - memoizado
  const handleNextStepWithPayment = useCallback((paymentMethod?: string) => {
    console.log(`[useCheckout] SISTEMA CORRIGIDO - handleNextStepWithPayment: ${paymentMethod || 'default'}`);
    
    if (!sessionUser?.id) {
      console.error('[useCheckout] Cannot proceed - user not authenticated');
      return;
    }

    if (navigation.handleNextStep && typeof navigation.handleNextStep === 'function') {
      navigation.handleNextStep(paymentMethod);
    }
  }, [navigation.handleNextStep, sessionUser?.id]);

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
    validateCoupon: handleValidateCoupon,
    handleNextStep: handleNextStepWithPayment,
    handlePrevStep: navigation.handlePrevStep,
    isNextEnabled: navigation.isNextEnabled,
    PLANS,
    calculateTotalPrice: () => orderTotal,
    calculateCartSubtotal: () => cartSubtotal,
    orderId,
    paymentMethod,
    setPaymentMethod
  };
};
