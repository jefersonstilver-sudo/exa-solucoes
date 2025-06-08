
import { useState, useEffect } from 'react';
import { useCartManager } from './useCartManager';
import { useCouponValidator } from './useCouponValidator';
import { useUserSession } from './useUserSession';
import { useEnhancedAttemptCapture } from './useEnhancedAttemptCapture';
import { useCheckoutNavigation } from './checkout/useCheckoutNavigation';
import { PlanKey, Plan } from '@/types/checkout';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { calculateTotalPrice as centralCalculateTotalPrice } from '@/utils/checkoutUtils';

interface CartItem {
  panel: Panel;
  duration: number;
}

// Export STEPS constant for compatibility
export const STEPS = {
  REVIEW: 0,
  PLAN: 1,
  COUPON: 2,
  PAYMENT: 3,
  UPLOAD: 4
};

// Export PLANS constant for compatibility
export const PLANS: Record<number, Plan> = {
  1: { id: 1, name: 'Mensal', months: 1, price: 1, discount: 0 },
  3: { id: 3, name: 'Trimestral', months: 3, price: 0.9, discount: 10 },
  6: { id: 6, name: 'Semestral', months: 6, price: 0.8, discount: 20 },
  12: { id: 12, name: 'Anual', months: 12, price: 0.7, discount: 30 }
};

export const useCheckout = () => {
  const { user: sessionUser, isLoading: isSessionLoading } = useUserSession();
  const { cartItems, selectedPlan, setSelectedPlan, handleClearCart } = useCartManager();
  const { 
    couponId, 
    couponCode,
    setCouponCode,
    couponDiscount, 
    couponValid, 
    couponMessage,
    isValidating: isValidatingCoupon,
    validateCoupon,
    applyCoupon, 
    removeCoupon 
  } = useCouponValidator();
  
  const [step, setStep] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [unavailablePanels, setUnavailablePanels] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "Checkout hook mounted",
      { cartItemsCount: cartItems.length, selectedPlan }
    );
  }, [cartItems, selectedPlan]);

  useEffect(() => {
    if (couponId) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "Coupon applied",
        { couponId, discount: couponDiscount }
      );
    }
  }, [couponId, couponDiscount]);

  const { handleNextStep, handlePrevStep, isNextEnabled, isNavigating } = useCheckoutNavigation({
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
    handleClearCart
  });

  // CORREÇÃO: Usar função centralizada para cálculo de preço total
  const calculateTotalPrice = () => {
    console.log("💰 [useCheckout] CALCULANDO PREÇO TOTAL:", {
      selectedPlan,
      cartItemsCount: cartItems.length,
      couponDiscount,
      couponValid,
      timestamp: new Date().toISOString()
    });

    const result = centralCalculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
    
    console.log("💰 [useCheckout] RESULTADO DO CÁLCULO:", {
      result,
      selectedPlan,
      cartItemsCount: cartItems.length,
      couponDiscount,
      couponValid
    });

    return result;
  };

  return {
    // State
    step,
    setStep,
    acceptTerms,
    setAcceptTerms,
    selectedPlan,
    setSelectedPlan,
    cartItems,
    unavailablePanels,
    setUnavailablePanels,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sessionUser,
    isSessionLoading,
    isCreatingPayment,
    
    // Coupon
    couponId,
    couponCode,
    setCouponCode,
    couponDiscount,
    couponValid,
    couponMessage,
    isValidatingCoupon,
    validateCoupon,
    applyCoupon,
    removeCoupon,
    
    // Navigation
    handleNextStep,
    handlePrevStep,
    isNextEnabled,
    isNavigating,
    
    // Actions
    handleClearCart,
    calculateTotalPrice,
    
    // Constants for compatibility
    PLANS
  };
};
