
import { useCheckout } from '@/hooks/useCheckout';
import { usePlanStorage } from './usePlanStorage';
import { usePlanCalculations } from './usePlanCalculations';
import { usePlanNavigation } from './usePlanNavigation';

export const usePlanSelection = (hasCart: boolean) => {
  // Estados do checkout
  const {
    selectedPlan, 
    setSelectedPlan,
    cartItems,
    PLANS
  } = useCheckout();

  // Storage operations
  const { savePlanToStorage } = usePlanStorage(setSelectedPlan);

  // Calculations
  const { calculateEstimatedPrice: calculatePrice } = usePlanCalculations();

  // Navigation
  const { handleGoToCoupon, handleProceed } = usePlanNavigation(
    selectedPlan, 
    savePlanToStorage
  );

  // Wrapper for price calculation with current state
  const calculateEstimatedPrice = () => {
    return calculatePrice(selectedPlan, cartItems, PLANS);
  };

  return {
    selectedPlan,
    setSelectedPlan,
    cartItems,
    PLANS,
    calculateEstimatedPrice,
    handleProceed,
    handleGoToCoupon
  };
};
