
import { PlanKey, Plan } from '@/types/checkout';
import { CartItem } from '@/types/cart';
import { calculateTotalPrice } from '@/utils/checkoutUtils';

export const usePlanCalculations = () => {
  // Calculate estimated total price based on cart and selected plan
  const calculateEstimatedPrice = (
    selectedPlan: PlanKey | null,
    cartItems: CartItem[],
    PLANS: Record<number, Plan>
  ) => {
    if (!selectedPlan || !cartItems.length) return 0;
    
    // Use the same calculation logic as checkoutUtils to ensure consistency
    return calculateTotalPrice(selectedPlan, cartItems, 0, false);
  };

  return {
    calculateEstimatedPrice
  };
};
