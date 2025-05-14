
import { useMemo } from 'react';
import { Panel } from '@/types/panel';
import { calculateTotalPrice } from '@/utils/checkoutUtils';
import { CHECKOUT_STEPS } from '@/constants/checkoutConstants';
import { PlanKey } from '@/types/checkout';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface UseCheckoutNavigationProps {
  step: number;
  setStep: (step: number) => void;
  selectedPlan: PlanKey;
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
  // Manipulador de próxima etapa
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
    setStep(step + 1);
  };
  
  // Manipulador de etapa anterior
  const handlePrevStep = () => {
    setStep(step - 1);
  };
  
  // Determina se o botão de próxima etapa deve estar habilitado
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
