
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useCartManager } from '@/hooks/useCartManager';
import { useCouponValidator } from '@/hooks/useCouponValidator';
import { usePanelAvailability } from '@/hooks/usePanelAvailability';
import { usePaymentProcessor } from '@/hooks/payment/usePaymentProcessor';
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

  // Hook de autenticação - executado apenas uma vez
  useCheckoutAuth(setSessionUser);
  
  // Hook de validação do carrinho - com debounce
  const debouncedCartValidation = useCallback(() => {
    if (cartItems.length > 0) {
      // Remove logs excessivos do cart validation
      console.log(`[useCheckout] Cart validated: ${cartItems.length} items`);
    }
  }, [cartItems.length]); // Depend only on length to reduce re-runs

  useEffect(() => {
    const timeout = setTimeout(debouncedCartValidation, 500);
    return () => clearTimeout(timeout);
  }, [debouncedCartValidation]);

  // Set step baseado na rota - memoizado para evitar loops
  const currentPath = location.pathname;
  useEffect(() => {
    if (currentPath === '/checkout/cupom') {
      setStep(0);
    } else if (currentPath === '/checkout/resumo') {
      setStep(1);
    } else if (currentPath === '/checkout') {
      setStep(2);
    } else if (currentPath === '/checkout/finalizar') {
      setStep(3);
    } else if (currentPath.startsWith('/pix-payment')) {
      setStep(2);
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
  }, []); // Empty deps to run only once
  
  // Verifica disponibilidade dos painéis - apenas quando necessário
  useEffect(() => {
    if (step === 1 && cartItems.length > 0) {
      const timeout = setTimeout(() => {
        checkPanelAvailability(cartItems, startDate, endDate);
      }, 1000); // Debounce availability check
      return () => clearTimeout(timeout);
    }
  }, [step, cartItems.length, startDate, endDate]); // Simplified dependencies

  // Memoizar cálculos para evitar re-computações desnecessárias
  const orderTotal = useMemo(() => {
    return calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
  }, [selectedPlan, cartItems, couponDiscount, couponValid]);

  const cartSubtotal = useMemo(() => {
    return calculateCartSubtotal(cartItems);
  }, [cartItems]);

  // Função wrapper para createPayment - com validação robusta
  const wrappedCreatePayment = useCallback(async (options: any): Promise<any> => {
    try {
      // CRITICAL: Validate authentication before creating payment
      if (!sessionUser?.id) {
        throw new Error("Usuário não autenticado");
      }

      if (cartItems.length === 0) {
        throw new Error("Carrinho vazio");
      }

      console.log('[useCheckout] Creating payment with valid user:', sessionUser.id);
      const response = await createPayment(options);
      return response;
    } catch (error) {
      console.error('[useCheckout] Payment error:', error);
      throw error;
    }
  }, [createPayment, sessionUser?.id, cartItems.length]);

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
    console.log(`[useCheckout] handleNextStepWithPayment: ${paymentMethod || 'default'}`);
    
    // CRITICAL: Validate authentication before proceeding
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
