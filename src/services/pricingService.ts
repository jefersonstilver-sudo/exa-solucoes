
import { PLANS } from '@/constants/checkoutConstants';

// Calculate total price for the cart
export const calculateTotalPrice = (
  cartItems: any[],
  selectedPlan: number,
  couponValid: boolean,
  couponDiscount: number
) => {
  // If cart is empty or no plan selected, return 0
  if (!cartItems.length || !selectedPlan) return 0;
  
  // Get the plan data
  const planData = PLANS[selectedPlan];
  
  // Base calculation: number of panels * price per panel per month * months
  const panelsCount = cartItems.length;
  const pricePerPanelPerMonth = planData.pricePerMonth || 250; // Fallback to 250 if not defined
  const months = planData.months;
  
  // Calculate subtotal
  const subtotal = panelsCount * pricePerPanelPerMonth * months;
  
  // Apply coupon discount if valid
  if (couponValid && couponDiscount > 0) {
    return subtotal * (1 - couponDiscount / 100);
  }
  
  return subtotal;
};

// Calculate cart subtotal (before discounts)
export const calculateCartSubtotal = (cartItems: any[]) => {
  if (!cartItems.length) return 0;
  
  // Sum up the base prices of all items in the cart
  return cartItems.reduce((total, item) => {
    const basePrice = item.panel?.basePrice || 0;
    return total + basePrice;
  }, 0);
};
