
import { calculatePriceWithDiscount } from '@/utils/priceUtils';
import { PLANS } from '@/constants/checkoutConstants';
import { PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

// FUNÇÃO CENTRAL: Get panel price considering its individual price (if available)
export const getPanelPrice = (panel: Panel, duration: number): number => {
  // Use the building's base price with NO fallback - use actual DB values
  const monthlyPrice = panel.buildings?.preco_base || 0;
  const months = duration / 30; // Convert days to months
  const totalPrice = monthlyPrice * months;
  
  console.log("💰 [getPanelPrice] Cálculo detalhado:", {
    panelId: panel.id,
    buildingName: panel.buildings?.nome,
    monthlyPrice,
    duration,
    months,
    totalPrice,
    timestamp: new Date().toISOString()
  });
  
  return totalPrice;
};

// FUNÇÃO CENTRAL: Calculate subtotal for all panels in cart based on their real prices
export const calculateCartSubtotal = (cartItems: CartItem[]): number => {
  const subtotal = cartItems.reduce((total, item) => {
    const panelPrice = getPanelPrice(item.panel, item.duration);
    console.log("💰 [calculateCartSubtotal] Item:", {
      panelId: item.panel.id,
      buildingName: item.panel.buildings?.nome,
      monthlyPrice: item.panel.buildings?.preco_base,
      duration: item.duration,
      panelPrice,
      runningTotal: total + panelPrice
    });
    return total + panelPrice;
  }, 0);
  
  console.log("💰 [calculateCartSubtotal] RESULTADO FINAL:", {
    itemCount: cartItems.length,
    subtotal,
    timestamp: new Date().toISOString()
  });
  
  return subtotal;
};

// FUNÇÃO CENTRAL: Calculate price per month for a specific plan based on cart items
export const calculatePricePerMonth = (
  selectedPlan: PlanKey,
  cartItems: CartItem[]
): number => {
  if (!cartItems.length) {
    console.warn("💰 [calculatePricePerMonth] Carrinho vazio");
    return 0;
  }
  
  const plan = PLANS[selectedPlan];
  
  // Calculate monthly price per panel using EXACT DB values
  const monthlyPricePerPanel = cartItems.reduce((total, item) => {
    const panelMonthlyPrice = item.panel.buildings?.preco_base || 0;
    console.log("💰 [calculatePricePerMonth] Painel mensal:", {
      panelId: item.panel.id,
      buildingName: item.panel.buildings?.nome,
      panelMonthlyPrice,
      runningTotal: total + panelMonthlyPrice
    });
    return total + panelMonthlyPrice;
  }, 0);
  
  // Apply plan discount to monthly price
  const discountedMonthlyPrice = plan.discount > 0 
    ? calculatePriceWithDiscount(monthlyPricePerPanel, plan.discount)
    : monthlyPricePerPanel;
  
  console.log("💰 [calculatePricePerMonth] RESULTADO:", {
    selectedPlan,
    planMonths: plan.months,
    planDiscount: plan.discount,
    monthlyPricePerPanel,
    discountedMonthlyPrice,
    timestamp: new Date().toISOString()
  });
  
  return discountedMonthlyPrice;
};

// FUNÇÃO CENTRAL: Calculate total price for the whole order
export const calculateTotalPrice = (
  selectedPlan: PlanKey, 
  cartItems: CartItem[], 
  couponDiscount: number, 
  couponValid: boolean
): number => {
  if (!cartItems.length) {
    console.warn("💰 [calculateTotalPrice] Carrinho vazio");
    return 0;
  }
  
  const plan = PLANS[selectedPlan];
  
  // Calculate monthly price per panel using EXACT DB values
  const monthlyPricePerPanel = cartItems.reduce((total, item) => {
    const panelMonthlyPrice = item.panel.buildings?.preco_base || 0;
    console.log("💰 [calculateTotalPrice] Processando painel:", {
      panelId: item.panel.id,
      buildingName: item.panel.buildings?.nome,
      preco_base: item.panel.buildings?.preco_base,
      panelMonthlyPrice,
      itemTotal: total + panelMonthlyPrice
    });
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
  
  console.log("💰 [calculateTotalPrice] CÁLCULO FINAL DETALHADO:", {
    cartItemsCount: cartItems.length,
    monthlyPricePerPanel,
    planMonths: plan.months,
    planDiscount: plan.discount,
    priceBeforeDiscount: monthlyPricePerPanel * plan.months,
    priceAfterPlanDiscount: plan.discount > 0 ? calculatePriceWithDiscount(monthlyPricePerPanel * plan.months, plan.discount) : monthlyPricePerPanel * plan.months,
    couponDiscount: couponValid ? couponDiscount : 0,
    finalTotal: totalPrice,
    timestamp: new Date().toISOString(),
    cartDetails: cartItems.map(item => ({
      panelId: item.panel.id,
      buildingName: item.panel.buildings?.nome,
      preco_base: item.panel.buildings?.preco_base,
      duration: item.duration
    }))
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
  
  // Calculate monthly price per panel using EXACT DB values
  const monthlyPricePerPanel = cartItems.reduce((total, item) => {
    const panelMonthlyPrice = item.panel.buildings?.preco_base || 0;
    return total + panelMonthlyPrice;
  }, 0);
  
  // Price without any discount (monthly rate * months)
  const fullPrice = monthlyPricePerPanel * plan.months;
  
  // Price with plan discount
  const discountedPrice = plan.discount > 0 
    ? calculatePriceWithDiscount(fullPrice, plan.discount)
    : fullPrice;
  
  const savings = fullPrice - discountedPrice;
  
  console.log("💰 [calculatePlanSavings] Economia calculada:", {
    selectedPlan,
    monthlyPricePerPanel,
    fullPrice,
    discountedPrice,
    savings,
    timestamp: new Date().toISOString()
  });
  
  return savings;
};

// Get plan details with dynamic pricing
export const getPlanWithDynamicPricing = (
  planKey: PlanKey,
  cartItems: CartItem[]
) => {
  const plan = PLANS[planKey];
  const pricePerMonth = calculatePricePerMonth(planKey, cartItems);
  const savings = calculatePlanSavings(planKey, cartItems);
  
  // Calculate monthly price per panel for subtotal using EXACT DB values
  const cartSubtotal = cartItems.reduce((total, item) => {
    const panelMonthlyPrice = item.panel.buildings?.preco_base || 0;
    return total + panelMonthlyPrice;
  }, 0);
  
  const result = {
    ...plan,
    dynamicPricePerMonth: pricePerMonth,
    dynamicTotalPrice: pricePerMonth * plan.months,
    dynamicSavings: savings,
    cartSubtotal
  };
  
  console.log("💰 [getPlanWithDynamicPricing] Plano com preços dinâmicos:", {
    planKey,
    cartItemsCount: cartItems.length,
    result,
    timestamp: new Date().toISOString()
  });
  
  return result;
};
