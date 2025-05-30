
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
  // Use the building's base price with fallback to a very low default (centavos)
  const monthlyPrice = panel.buildings?.preco_base || 0.05; // 5 centavos como fallback
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
  
  const plan = PLANS[selectedPlan];
  
  // Calculate monthly price per panel
  const monthlyPricePerPanel = cartItems.reduce((total, item) => {
    const panelMonthlyPrice = item.panel.buildings?.preco_base || 0.05;
    return total + panelMonthlyPrice;
  }, 0);
  
  // Apply plan discount to monthly price
  const discountedMonthlyPrice = plan.discount > 0 
    ? calculatePriceWithDiscount(monthlyPricePerPanel, plan.discount)
    : monthlyPricePerPanel;
  
  return discountedMonthlyPrice;
};

// Calculate total price for the whole order
export const calculateTotalPrice = (
  selectedPlan: PlanKey, 
  cartItems: CartItem[], 
  couponDiscount: number, 
  couponValid: boolean
): number => {
  if (!cartItems.length) return 0;
  
  const plan = PLANS[selectedPlan];
  
  // Calculate monthly price per panel
  const monthlyPricePerPanel = cartItems.reduce((total, item) => {
    const panelMonthlyPrice = item.panel.buildings?.preco_base || 0.05;
    return total + panelMonthlyPrice;
  }, 0);
  
  // Calculate total for the plan period
  let totalPrice = monthlyPricePerPanel * plan.months;
  
  // Apply plan discount first
  if (plan.discount > 0) {
    totalPrice = calculatePriceWithDiscount(totalPrice, plan.discount);
  }
  
  // Apply coupon discount if valid
  if (couponValid && couponDiscount > 0) {
    totalPrice = calculatePriceWithDiscount(totalPrice, couponDiscount);
  }
  
  console.log("💰 Cálculo de preço detalhado:", {
    monthlyPricePerPanel,
    planMonths: plan.months,
    planDiscount: plan.discount,
    priceBeforeDiscount: monthlyPricePerPanel * plan.months,
    priceAfterPlanDiscount: totalPrice,
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
  
  const plan = PLANS[selectedPlan];
  
  // Calculate monthly price per panel
  const monthlyPricePerPanel = cartItems.reduce((total, item) => {
    const panelMonthlyPrice = item.panel.buildings?.preco_base || 0.05;
    return total + panelMonthlyPrice;
  }, 0);
  
  // Price without any discount (monthly rate * months)
  const fullPrice = monthlyPricePerPanel * plan.months;
  
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
  
  // Calculate monthly price per panel for subtotal
  const cartSubtotal = cartItems.reduce((total, item) => {
    const panelMonthlyPrice = item.panel.buildings?.preco_base || 0.05;
    return total + panelMonthlyPrice;
  }, 0);
  
  return {
    ...plan,
    dynamicPricePerMonth: pricePerMonth,
    dynamicTotalPrice: pricePerMonth * plan.months,
    dynamicSavings: savings,
    cartSubtotal
  };
};
