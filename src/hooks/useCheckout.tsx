
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

export const STEPS = CHECKOUT_STEPS; // Re-exporta para compatibilidade
export { PLANS }; // Re-exporta para compatibilidade

export const useCheckout = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  
  // Usa os hooks modularizados
  const { cartItems, handleClearCart } = useCartManager();
  
  const {
    step, setStep,
    selectedPlan, setSelectedPlan,
    acceptTerms, setAcceptTerms,
    startDate, endDate,
    sessionUser, setSessionUser,
    STEPS
  } = useCheckoutState();

  // Carrega plano selecionado do localStorage (vem da página PlanSelection)
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
      console.error('Erro ao carregar plano selecionado:', error);
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
    if (step === STEPS.REVIEW) {
      checkPanelAvailability(cartItems, startDate, endDate);
    }
  }, [step, startDate, endDate, cartItems, checkPanelAvailability, STEPS.REVIEW]);

  // Adapta a função validateCoupon para a nova estrutura
  const handleValidateCoupon = () => {
    validateCoupon(selectedPlan);
  };

  // Define handler for next step with optional payment method
  const handleNextStepWithPayment = (paymentMethod?: string) => {
    if (handleNavigation.handleNextStep && typeof handleNavigation.handleNextStep === 'function') {
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
    createPayment
  });
  
  const { isNavigating } = handleNavigation;

  // Log para diagnóstico dos cálculos
  useEffect(() => {
    console.log("Dados do carrinho no useCheckout:", cartItems);
    if (cartItems.length > 0) {
      console.log("Subtotal calculado:", calculateCartSubtotal(cartItems));
      console.log("Total calculado:", calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid));
    }
  }, [cartItems, selectedPlan, couponDiscount, couponValid]);

  // Função para calcular o total do pedido (usado no PaymentStep)
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
