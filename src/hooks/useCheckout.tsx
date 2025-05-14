
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCartManager } from '@/hooks/useCartManager';
import { useCouponValidator } from '@/hooks/useCouponValidator';
import { usePanelAvailability } from '@/hooks/usePanelAvailability';
import { usePaymentProcessor } from '@/hooks/usePaymentProcessor';
import { calculateTotalPrice } from '@/utils/checkoutUtils';
import { CHECKOUT_STEPS, PLANS } from '@/constants/checkoutConstants';
import { useCheckoutState } from '@/hooks/checkout/useCheckoutState';
import { useCheckoutAuth } from '@/hooks/checkout/useCheckoutAuth';
import { useCartValidation } from '@/hooks/checkout/useCartValidation';
import { useCheckoutNavigation } from '@/hooks/checkout/useCheckoutNavigation';

export const STEPS = CHECKOUT_STEPS; // Re-export for backward compatibility
export { PLANS }; // Re-export for backward compatibility

export const useCheckout = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  
  // Use the modularized hooks
  const { cartItems, handleClearCart } = useCartManager();
  
  const {
    step, setStep,
    selectedPlan, setSelectedPlan,
    acceptTerms, setAcceptTerms,
    startDate, endDate,
    sessionUser, setSessionUser,
    STEPS
  } = useCheckoutState();

  // Authentication hook
  useCheckoutAuth(setSessionUser);
  
  // Cart validation hook
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
  
  // Check panel availability when step changes to plan selection
  useEffect(() => {
    if (step === STEPS.PLAN) {
      checkPanelAvailability(cartItems, startDate, endDate);
    }
  }, [step, startDate, endDate, cartItems, checkPanelAvailability, STEPS.PLAN]);

  // Handle validateCoupon to adapt to the new structure
  const handleValidateCoupon = () => {
    validateCoupon(selectedPlan);
  };

  // Use the navigation hook
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
