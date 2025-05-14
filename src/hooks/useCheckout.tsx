
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCartManager } from '@/hooks/useCartManager';
import { useCouponValidator } from '@/hooks/useCouponValidator';
import { usePanelAvailability } from '@/hooks/usePanelAvailability';
import { usePaymentProcessor } from '@/hooks/payment/usePaymentProcessor';
import { calculateTotalPrice } from '@/utils/checkoutUtils';
import { CHECKOUT_STEPS, PLANS } from '@/constants/checkoutConstants';
import { useCheckoutState } from '@/hooks/checkout/useCheckoutState';
import { useCheckoutAuth } from '@/hooks/checkout/useCheckoutAuth';
import { useCartValidation } from '@/hooks/checkout/useCartValidation';
import { useCheckoutNavigation } from '@/hooks/checkout/useCheckoutNavigation';

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
    createPayment
  } = usePaymentProcessor();
  
  // Verifica a disponibilidade dos painéis quando a etapa muda para seleção de plano
  useEffect(() => {
    if (step === STEPS.PLAN) {
      checkPanelAvailability(cartItems, startDate, endDate);
    }
  }, [step, startDate, endDate, cartItems, checkPanelAvailability, STEPS.PLAN]);

  // Adapta a função validateCoupon para a nova estrutura
  const handleValidateCoupon = () => {
    validateCoupon(selectedPlan);
  };

  // Usa o hook de navegação
  const { handleNextStep, handlePrevStep, isNextEnabled } = useCheckoutNavigation({
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
    unavailablePanels,
    cartItems,
    validateCoupon: handleValidateCoupon,
    handleNextStep,
    handlePrevStep,
    isNextEnabled,
    PLANS,
    calculateTotalPrice: () => calculateTotalPrice(selectedPlan, cartItems.length, couponDiscount, couponValid),
    orderId
  };
};
