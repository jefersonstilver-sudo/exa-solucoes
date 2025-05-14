
import { calculatePriceWithDiscount } from '@/utils/priceUtils';
import { PLANS } from '@/constants/checkoutConstants';
import { PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

// Get panel price considering its individual price (if available)
export const getPanelPrice = (panel: Panel, duration: number): number => {
  // Use a default price if the building price is not available
  // Instead of accessing preco_mensal which doesn't exist in the Building type
  const monthlyPrice = panel.buildings?.basePrice || 250;
  const months = duration / 30; // Convert days to months
  return monthlyPrice * months;
};

// Calculate subtotal for all panels in cart
export const calculateCartSubtotal = (cartItems: CartItem[]): number => {
  return cartItems.reduce((total, item) => {
    return total + getPanelPrice(item.panel, item.duration);
  }, 0);
};

// Calculate total price for the whole order
export const calculateTotalPrice = (
  selectedPlan: PlanKey, 
  cartItems: CartItem[], 
  couponDiscount: number, 
  couponValid: boolean
) => {
  // Calculate base price from actual panel prices
  const subtotal = calculateCartSubtotal(cartItems);
  
  // Log for debugging
  console.log("Subtotal calculado em checkoutUtils:", subtotal);
  
  let totalPrice = subtotal;
  
  // Apply plan discount
  if (PLANS[selectedPlan].discount > 0) {
    totalPrice = calculatePriceWithDiscount(totalPrice, PLANS[selectedPlan].discount);
  }
  
  // Apply coupon discount if valid
  if (couponValid && couponDiscount > 0) {
    totalPrice = calculatePriceWithDiscount(totalPrice, couponDiscount);
  }
  
  return totalPrice;
};
