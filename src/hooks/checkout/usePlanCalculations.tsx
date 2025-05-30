
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
    
    // Use actual plan pricing calculation
    const plan = PLANS[selectedPlan];
    const pricePerPanelPerMonth = 250; // Base price per panel per month
    const totalPanels = cartItems.length;
    const months = plan.months;
    
    // Calculate base price
    let totalPrice = totalPanels * pricePerPanelPerMonth * months;
    
    // Apply plan discount
    if (plan.discount > 0) {
      const discountMultiplier = (100 - plan.discount) / 100;
      totalPrice = totalPrice * discountMultiplier;
    }
    
    return totalPrice;
  };

  return {
    calculateEstimatedPrice
  };
};
