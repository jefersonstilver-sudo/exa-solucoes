import { useState, useEffect } from 'react';
import { useCartManager } from './useCartManager';
import { useCouponValidator } from './useCouponValidator';
import { useUserSession } from './useUserSession';
import { useEnhancedAttemptCapture } from './useEnhancedAttemptCapture';
import { useCheckoutNavigation } from './checkout/useCheckoutNavigation';
import { PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCheckout = () => {
  const { user: sessionUser, isLoading: isSessionLoading } = useUserSession();
  const { cartItems, selectedPlan, handleClearCart } = useCartManager();
  const { 
    couponId, 
    couponDiscount, 
    couponValid, 
    applyCoupon, 
    removeCoupon 
  } = useCouponValidator();
  
  const [step, setStep] = useState(0);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [unavailablePanels, setUnavailablePanels] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    logCheckoutEvent(
      CheckoutEvent.COMPONENT_MOUNT,
      LogLevel.INFO,
      "Checkout hook mounted",
      { cartItemsCount: cartItems.length, selectedPlan }
    );
  }, [cartItems, selectedPlan]);

  useEffect(() => {
    if (couponId) {
      logCheckoutEvent(
        CheckoutEvent.COUPON_APPLIED,
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

  return {
    // State
    step,
    setStep,
    acceptTerms,
    setAcceptTerms,
    selectedPlan,
    cartItems,
    unavailablePanels,
    setUnavailablePanels,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sessionUser,
    isSessionLoading,
    
    // Coupon
    couponId,
    couponDiscount,
    couponValid,
    applyCoupon,
    removeCoupon,
    
    // Navigation
    handleNextStep,
    handlePrevStep,
    isNextEnabled,
    isNavigating,
    
    // Actions
    handleClearCart
  };
};
