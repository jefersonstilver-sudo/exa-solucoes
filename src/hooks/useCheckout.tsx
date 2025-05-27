
import { useEffect, useState } from 'react';
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

  // CORREÇÃO MEGA: Set step baseado na rota atual
  useEffect(() => {
    const path = location.pathname;
    console.log("[useCheckout] MEGA CHECKOUT: Current path:", path);
    
    // Mapear rotas para steps corretamente
    if (path === '/checkout/cupom') {
      setStep(0); // Cupom
    } else if (path === '/checkout/resumo') {
      setStep(1); // Resumo
    } else if (path === '/checkout') {
      setStep(2); // Seleção de método de pagamento (CORREÇÃO CRÍTICA!)
    } else if (path === '/checkout/finalizar') {
      setStep(3); // Upload/Finalizar
    } else if (path.startsWith('/pix-payment')) {
      // PIX payment em andamento - manter step 2
      setStep(2);
    }
  }, [location.pathname, setStep]);

  // Carrega plano selecionado do localStorage
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('selectedPlan');
      console.log('[useCheckout] MEGA CHECKOUT: Plano carregado do localStorage:', savedPlan);
      
      if (savedPlan) {
        const parsedPlan = parseInt(savedPlan);
        if ([1, 3, 6, 12].includes(parsedPlan)) {
          setSelectedPlan(parsedPlan as PlanKey);
        }
      }
    } catch (error) {
      console.error('[useCheckout] Erro ao carregar plano selecionado:', error);
    }
  }, [setSelectedPlan]);

  // Hook de autenticação
  useCheckoutAuth(setSessionUser);
  
  // Hook de validação do carrinho
  useCartValidation(cartItems);
  
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
  
  // Verifica a disponibilidade dos painéis quando a etapa muda para revisão
  useEffect(() => {
    if (step === 1) { // SUMMARY step
      checkPanelAvailability(cartItems, startDate, endDate);
    }
  }, [step, startDate, endDate, cartItems, checkPanelAvailability]);

  // Log payment method changes for debugging
  useEffect(() => {
    if (paymentMethod) {
      console.log(`[useCheckout] MEGA CHECKOUT: Payment method selected: ${paymentMethod}, step: ${step}`);
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        `Payment method selected: ${paymentMethod}`,
        { paymentMethod, step }
      );
    }
  }, [paymentMethod, step]);

  // Adapta a função validateCoupon para a nova estrutura
  const handleValidateCoupon = () => {
    validateCoupon(couponCode, selectedPlan);
  };

  // FIXED: Create a wrapper function that properly handles PaymentResponse
  const wrappedCreatePayment = async (options: any): Promise<void> => {
    try {
      const response = await createPayment(options);
      console.log('[useCheckout] MEGA CHECKOUT: Payment created:', response);
    } catch (error) {
      console.error('[useCheckout] MEGA CHECKOUT: Payment error:', error);
      throw error;
    }
  };

  // Define handler for next step with explicit payment method
  const handleNextStepWithPayment = (paymentMethod?: string) => {
    console.log(`[useCheckout] MEGA CHECKOUT: handleNextStepWithPayment called with method: ${paymentMethod || 'default'}`);
    
    if (handleNavigation.handleNextStep && typeof handleNavigation.handleNextStep === 'function') {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        `Calling handleNextStep with method: ${paymentMethod || 'default'}`,
        { paymentMethod }
      );
      
      handleNavigation.handleNextStep(paymentMethod);
    }
  };

  // Usa o hook de navegação
  const handleNavigation = useCheckoutNavigation({
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
  
  const { isNavigating } = handleNavigation;

  // Log para diagnóstico dos cálculos
  useEffect(() => {
    console.log("[useCheckout] MEGA CHECKOUT: Cart data:", cartItems);
    if (cartItems.length > 0) {
      console.log("[useCheckout] MEGA CHECKOUT: Calculated subtotal:", calculateCartSubtotal(cartItems));
      console.log("[useCheckout] MEGA CHECKOUT: Calculated total:", calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid));
    }
  }, [cartItems, selectedPlan, couponDiscount, couponValid]);

  // Função para calcular o total do pedido
  const getOrderTotal = () => {
    return calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
  };

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
    isNavigating,
    unavailablePanels,
    cartItems,
    validateCoupon: handleValidateCoupon,
    handleNextStep: handleNextStepWithPayment,
    handlePrevStep: handleNavigation.handlePrevStep,
    isNextEnabled: handleNavigation.isNextEnabled,
    PLANS,
    calculateTotalPrice: getOrderTotal,
    calculateCartSubtotal: () => calculateCartSubtotal(cartItems),
    orderId,
    paymentMethod,
    setPaymentMethod
  };
};
