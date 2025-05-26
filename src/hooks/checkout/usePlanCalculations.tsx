
import { PlanKey, Plan } from '@/types/checkout';
import { CartItem } from '@/types/cart';

export const usePlanCalculations = () => {
  // Calculate estimated total price based on cart and selected plan
  const calculateEstimatedPrice = (
    selectedPlan: PlanKey | null,
    cartItems: CartItem[],
    PLANS: Record<number, Plan>
  ) => {
    if (!selectedPlan || !cartItems.length) return 0;
    
    // Base calculation: number of panels * basic price per panel * months
    const pricePerPanelPerMonth = 250; // Example base price
    const totalPanels = cartItems.length;
    const months = PLANS[selectedPlan].months;
    
    return totalPanels * pricePerPanelPerMonth * months;
  };

  return {
    calculateEstimatedPrice
  };
};
