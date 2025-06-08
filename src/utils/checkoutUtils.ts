
// CORREÇÃO COMPLETA: Sistema de Cálculo de Preços Unificado

import { Panel } from '@/types/panel';
import { PlanKey } from '@/types/checkout';
import { logPriceCalculation } from './auditLogger';

interface CartItem {
  panel: Panel;
  duration: number;
  price?: number;
}

// FUNÇÃO CORRIGIDA: Cálculo de preço total com desconto aplicado corretamente
export const calculateTotalPrice = (
  selectedPlan: PlanKey | null,
  cartItems: CartItem[],
  couponDiscount: number = 0,
  couponValid: boolean = false
): number => {
  if (!selectedPlan || !cartItems || cartItems.length === 0) {
    console.log("💰 [CheckoutUtils] CÁLCULO CANCELADO - Dados insuficientes:", {
      selectedPlan,
      cartItemsLength: cartItems?.length || 0
    });
    return 0;
  }

  console.log("💰 [CheckoutUtils] INICIANDO CÁLCULO CORRIGIDO:", {
    selectedPlan,
    cartItemsCount: cartItems.length,
    couponDiscount,
    couponValid,
    timestamp: new Date().toISOString()
  });

  // Calcular subtotal dos painéis
  let subtotal = 0;
  cartItems.forEach((item, index) => {
    const basePrice = item.panel?.buildings?.preco_base || 0;
    subtotal += basePrice;
    
    console.log(`💰 [CheckoutUtils] Item ${index}:`, {
      panelId: item.panel?.id,
      buildingName: item.panel?.buildings?.nome,
      basePrice,
      subtotalAtual: subtotal
    });
  });

  // Aplicar multiplicador do plano
  let totalWithPlan = subtotal * selectedPlan;
  
  console.log("💰 [CheckoutUtils] TOTAL COM PLANO:", {
    subtotal,
    planMultiplier: selectedPlan,
    totalWithPlan,
    calculation: `R$ ${subtotal} × ${selectedPlan} meses = R$ ${totalWithPlan}`
  });

  // Aplicar desconto se válido - CORREÇÃO CRÍTICA
  let finalPrice = totalWithPlan;
  if (couponValid && couponDiscount > 0) {
    const discountAmount = (totalWithPlan * couponDiscount) / 100;
    finalPrice = totalWithPlan - discountAmount;
    
    console.log("💰 [CheckoutUtils] DESCONTO APLICADO CORRETAMENTE:", {
      totalWithPlan,
      couponDiscount: `${couponDiscount}%`,
      discountAmount,
      finalPrice,
      calculation: `R$ ${totalWithPlan} - (${couponDiscount}% = R$ ${discountAmount}) = R$ ${finalPrice}`
    });
  }

  // Arredondar para 2 casas decimais
  finalPrice = Math.round(finalPrice * 100) / 100;

  console.log("💰 [CheckoutUtils] RESULTADO FINAL:", {
    selectedPlan,
    cartItemsCount: cartItems.length,
    finalPrice,
    withDiscount: couponValid && couponDiscount > 0,
    expectedResult: "R$ 0.27 com desconto de 10%"
  });

  return finalPrice;
};

// Cálculo do subtotal do carrinho
export const calculateCartSubtotal = (cartItems: CartItem[]): number => {
  if (!cartItems || cartItems.length === 0) {
    return 0;
  }

  const subtotal = cartItems.reduce((total, item) => {
    const basePrice = item.panel?.buildings?.preco_base || 0;
    return total + basePrice;
  }, 0);

  console.log("💰 [CheckoutUtils] SUBTOTAL CALCULADO:", {
    cartItemsCount: cartItems.length,
    subtotal
  });

  return subtotal;
};

// Calcular preços dinâmicos para exibição nos cartões de plano
export const getPlanWithDynamicPricing = (planKey: PlanKey, cartItems: CartItem[]): any => {
  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  const subtotal = calculateCartSubtotal(cartItems);
  const totalPrice = subtotal * planKey;
  const pricePerMonth = totalPrice / planKey;
  const oneMonthTotal = subtotal * 1;
  const savings = planKey > 1 ? (oneMonthTotal * planKey) - totalPrice : 0;

  return {
    dynamicPricePerMonth: pricePerMonth,
    dynamicTotalPrice: totalPrice,
    dynamicSavings: savings
  };
};

// Validar integridade de preços
export const validatePriceIntegrity = (
  selectedPlan: PlanKey,
  cartItems: CartItem[],
  expectedTotal: number
): { isValid: boolean; calculatedTotal: number; difference: number } => {
  const calculatedTotal = calculateTotalPrice(selectedPlan, cartItems, 0, false);
  const difference = Math.abs(expectedTotal - calculatedTotal);
  const isValid = difference < 0.01;

  if (!isValid) {
    console.error("❌ [CheckoutUtils] DIVERGÊNCIA DE PREÇO:", {
      expectedTotal,
      calculatedTotal,
      difference
    });
  }

  return { isValid, calculatedTotal, difference };
};
