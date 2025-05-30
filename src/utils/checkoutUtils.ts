
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
  // Use the building's base price with fallback to default
  const monthlyPrice = panel.buildings?.preco_base || panel.buildings?.basePrice || 250;
  const months = duration / 30; // Convert days to months
  return monthlyPrice * months;
};

// Calculate subtotal for all panels in cart based on their real prices
export const calculateCartSubtotal = (cartItems: CartItem[]): number => {
  return cartItems.reduce((total, item) => {
    const panelPrice = getPanelPrice(item.panel, item.duration);
    return total + panelPrice;
  }, 0);
};

// Calculate price per month for a specific plan based on cart items
export const calculatePricePerMonth = (
  selectedPlan: PlanKey,
  cartItems: CartItem[]
): number => {
  if (!cartItems.length) return 0;
  
  const cartSubtotal = calculateCartSubtotal(cartItems);
  const plan = PLANS[selectedPlan];
  
  // Calculate total for the plan period
  const totalWithoutDiscount = cartSubtotal * plan.months;
  
  // Apply plan discount
  const totalWithDiscount = plan.discount > 0 
    ? calculatePriceWithDiscount(totalWithoutDiscount, plan.discount)
    : totalWithoutDiscount;
  
  // Return price per month
  return totalWithDiscount / plan.months;
};

// Calculate total price for the whole order
export const calculateTotalPrice = (
  selectedPlan: PlanKey, 
  cartItems: CartItem[], 
  couponDiscount: number, 
  couponValid: boolean
): number => {
  if (!cartItems.length) return 0;
  
  // Calculate base price from actual panel prices for the selected period
  const cartSubtotal = calculateCartSubtotal(cartItems);
  const plan = PLANS[selectedPlan];
  
  // Calculate total for the plan period
  let totalPrice = cartSubtotal * plan.months;
  
  // Apply plan discount first
  if (plan.discount > 0) {
    totalPrice = calculatePriceWithDiscount(totalPrice, plan.discount);
  }
  
  // Apply coupon discount if valid
  if (couponValid && couponDiscount > 0) {
    totalPrice = calculatePriceWithDiscount(totalPrice, couponDiscount);
  }
  
  console.log("Cálculo de preço:", {
    cartSubtotal,
    planMonths: plan.months,
    planDiscount: plan.discount,
    couponDiscount: couponValid ? couponDiscount : 0,
    finalTotal: totalPrice
  });
  
  return totalPrice;
};

// Calculate savings for a plan compared to monthly
export const calculatePlanSavings = (
  selectedPlan: PlanKey,
  cartItems: CartItem[]
): number => {
  if (!cartItems.length || selectedPlan === 1) return 0;
  
  const cartSubtotal = calculateCartSubtotal(cartItems);
  const plan = PLANS[selectedPlan];
  
  // Price without any discount (monthly rate * months)
  const fullPrice = cartSubtotal * plan.months;
  
  // Price with plan discount
  const discountedPrice = plan.discount > 0 
    ? calculatePriceWithDiscount(fullPrice, plan.discount)
    : fullPrice;
  
  return fullPrice - discountedPrice;
};

// Get plan details with dynamic pricing
export const getPlanWithDynamicPricing = (
  planKey: PlanKey,
  cartItems: CartItem[]
) => {
  const plan = PLANS[planKey];
  const pricePerMonth = calculatePricePerMonth(planKey, cartItems);
  const savings = calculatePlanSavings(planKey, cartItems);
  const cartSubtotal = calculateCartSubtotal(cartItems);
  
  return {
    ...plan,
    dynamicPricePerMonth: pricePerMonth,
    dynamicTotalPrice: pricePerMonth * plan.months,
    dynamicSavings: savings,
    cartSubtotal
  };
};
