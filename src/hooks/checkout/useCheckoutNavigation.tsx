
import { useMemo } from 'react';
import { Panel } from '@/types/panel';
import { calculateTotalPrice } from '@/utils/checkoutUtils';
import { CHECKOUT_STEPS } from '@/constants/checkoutConstants';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface UseCheckoutNavigationProps {
  step: number;
  setStep: (step: number) => void;
  selectedPlan: 1 | 3 | 6 | 12;
  cartItems: CartItem[];
  couponDiscount: number;
  couponValid: boolean;
  acceptTerms: boolean;
  unavailablePanels: string[];
  couponId: string | null;
  startDate: Date;
  endDate: Date;
  sessionUser: any;
  handleClearCart: () => void;
  createPayment: (options: any) => void;
}

export const useCheckoutNavigation = ({
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
}: UseCheckoutNavigationProps) => {
  // Next step handler
  const handleNextStep = () => {
    if (step === CHECKOUT_STEPS.PAYMENT) {
      const totalPrice = calculateTotalPrice(selectedPlan, cartItems.length, couponDiscount, couponValid);
      
      createPayment({
        totalPrice,
        selectedPlan,
        cartItems,
        startDate,
        endDate,
        couponId,
        acceptTerms,
        unavailablePanels,
        sessionUser,
        handleClearCart
      });
      return;
    }
    setStep(prev => prev + 1);
  };
  
  // Previous step handler
  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };
  
  // Determine whether the next button should be enabled
  const isNextEnabled = useMemo(() => {
    if (step === CHECKOUT_STEPS.REVIEW && unavailablePanels.length > 0) return false;
    if (step === CHECKOUT_STEPS.PAYMENT && !acceptTerms) return false;
    return true;
  }, [step, unavailablePanels, acceptTerms]);

  return {
    handleNextStep,
    handlePrevStep,
    isNextEnabled
  };
};
