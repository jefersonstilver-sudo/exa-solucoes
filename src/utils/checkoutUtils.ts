
// CORREÇÃO COMPLETA: Sistema de Cálculo de Preços Baseado no Prédio

import { Panel } from '@/types/panel';
import { PlanKey } from '@/types/checkout';
import { logPriceCalculation } from './auditLogger';
import { MINIMUM_ORDER_VALUE } from './priceCalculator';

interface CartItem {
  panel: Panel;
  duration: number;
  price?: number;
}

// DESCONTOS POR PLANO (percentuais de desconto)
const PLAN_DISCOUNTS = {
  1: 0,     // 0% desconto (preço cheio)
  3: 0.20,  // 20% desconto  
  6: 0.30,  // 30% desconto
  12: 0.375 // 37.5% desconto
};

// FUNÇÃO CORRIGIDA: Calcular preço de um painel individual baseado no prédio
export const getPanelPrice = (panel: Panel, duration: number = 30): number => {
  // Usar preco_base do prédio ou fallback para R$ 200
  const basePricePerMonth = panel.buildings?.preco_base || 200;
  const months = duration / 30;
  const totalPrice = basePricePerMonth * months;
  
  console.log("💰 [getPanelPrice] CÁLCULO BASEADO NO PRÉDIO:", {
    panelId: panel.id,
    buildingName: panel.buildings?.nome,
    basePricePerMonth,
    duration,
    months,
    totalPrice,
    calculation: `R$ ${basePricePerMonth}/mês × ${months} meses = R$ ${totalPrice}`
  });
  
  return totalPrice;
};

// FUNÇÃO CORRIGIDA: Cálculo de preço total baseado nos preços dos prédios
export const calculateTotalPrice = (
  selectedPlan: PlanKey | null,
  cartItems: CartItem[],
  couponDiscount: number = 0,
  couponValid: boolean = false,
  couponCode?: string,
  couponCategoria?: string
): number => {
  // 🎁 CUPOM CORTESIA: Força R$ 0,00 SEMPRE
  if (couponCategoria === 'cortesia' || couponCode?.toUpperCase().trim() === 'CORTESIA_ADMIN') {
    console.log("🎁🎁🎁 [CheckoutUtils] CUPOM CORTESIA DETECTADO - Forçando R$ 0,00");
    return 0;
  }
  
  // 🎯 CUPOM ESPECIAL 573040: Força R$ 0,05 SEMPRE
  if (couponCode === '573040') {
    console.log("🎯🎯🎯 [CheckoutUtils] CUPOM 573040 DETECTADO - Forçando R$ 0,05");
    return 0.05;
  }
  
  if (!selectedPlan || !cartItems || cartItems.length === 0) {
    console.log("💰 [CheckoutUtils] CÁLCULO CANCELADO - Dados insuficientes:", {
      selectedPlan,
      cartItemsLength: cartItems?.length || 0
    });
    return 0;
  }

  console.log("💰 [CheckoutUtils] INICIANDO CÁLCULO BASEADO NOS PRÉDIOS:", {
    selectedPlan,
    cartItemsCount: cartItems.length,
    couponDiscount,
    couponValid,
    couponCode: couponCode || 'SEM CÓDIGO',
    timestamp: new Date().toISOString()
  });

  const planDiscount = PLAN_DISCOUNTS[selectedPlan] || 0;
  
  // CORREÇÃO: Calcular preço total baseado nos preços individuais dos prédios
  let totalWithPlan = 0;
  
  cartItems.forEach(item => {
    const basePricePerMonth = item.panel.buildings?.preco_base || 200;
    const priceWithDiscount = basePricePerMonth * (1 - planDiscount);
    const itemTotal = priceWithDiscount * selectedPlan; // multiplicar pelos meses do plano
    totalWithPlan += itemTotal;
    
    console.log("💰 [CheckoutUtils] ITEM CALCULADO:", {
      buildingName: item.panel.buildings?.nome,
      basePricePerMonth,
      planDiscount: `${planDiscount * 100}%`,
      priceWithDiscount,
      planMonths: selectedPlan,
      itemTotal,
      calculation: `R$ ${basePricePerMonth} × (1 - ${planDiscount}) × ${selectedPlan} meses = R$ ${itemTotal}`
    });
  });
  
  console.log("💰 [CheckoutUtils] TOTAL COM PLANO:", {
    selectedPlan,
    totalWithPlan,
    planDiscount: `${planDiscount * 100}%`
  });

  // Aplicar desconto se válido
  let finalPrice = totalWithPlan;
  if (couponValid && couponDiscount > 0) {
    const discountAmount = (totalWithPlan * couponDiscount) / 100;
    finalPrice = totalWithPlan - discountAmount;
    
    console.log("💰 [CheckoutUtils] DESCONTO APLICADO:", {
      totalWithPlan,
      couponDiscount: `${couponDiscount}%`,
      discountAmount,
      finalPrice,
      calculation: `R$ ${totalWithPlan} - (${couponDiscount}% = R$ ${discountAmount}) = R$ ${finalPrice}`
    });
  }

  // CORREÇÃO CRÍTICA: Aplicar valor mínimo (nunca menos que R$ 0,05)
  finalPrice = Math.max(finalPrice, MINIMUM_ORDER_VALUE);
  
  // Arredondar para 2 casas decimais
  finalPrice = Math.round(finalPrice * 100) / 100;

  console.log("💰 [CheckoutUtils] RESULTADO FINAL COM VALOR MÍNIMO:", {
    selectedPlan,
    cartItemsCount: cartItems.length,
    finalPrice,
    withDiscount: couponValid && couponDiscount > 0,
    minimumApplied: finalPrice === MINIMUM_ORDER_VALUE
  });

  return finalPrice;
};

// NOVA FUNÇÃO: Calcular preços dinâmicos para exibição nos cartões de plano
export const getPlanWithDynamicPricing = (planKey: PlanKey, cartItems: CartItem[]): any => {
  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  const planDiscount = PLAN_DISCOUNTS[planKey] || 0;
  
  // Calcular total baseado nos preços individuais dos prédios
  let totalPrice = 0;
  let pricePerMonthTotal = 0;
  
  cartItems.forEach(item => {
    const basePricePerMonth = item.panel.buildings?.preco_base || 200;
    const priceWithDiscount = basePricePerMonth * (1 - planDiscount);
    totalPrice += priceWithDiscount * planKey; // total para o período
    pricePerMonthTotal += priceWithDiscount; // total mensal
  });
  
  // Calcular economia comparado ao plano mensal
  const monthlyPlanTotal = cartItems.reduce((sum, item) => {
    return sum + (item.panel.buildings?.preco_base || 200) * planKey;
  }, 0);
  const savings = planKey > 1 ? monthlyPlanTotal - totalPrice : 0;

  console.log("💰 [getPlanWithDynamicPricing] CÁLCULO BASEADO NOS PRÉDIOS:", {
    planKey,
    totalPanels: cartItems.length,
    planDiscount: `${planDiscount * 100}%`,
    totalPrice,
    pricePerMonthTotal,
    savings
  });

  return {
    dynamicPricePerMonth: pricePerMonthTotal,
    dynamicTotalPrice: totalPrice,
    dynamicSavings: savings
  };
};

// Função para obter desconto de um plano específico
export const getPlanDiscount = (planKey: PlanKey): number => {
  return PLAN_DISCOUNTS[planKey] || 0;
};

// Cálculo do subtotal do carrinho baseado nos preços dos prédios
export const calculateCartSubtotal = (cartItems: CartItem[], selectedPlan: PlanKey = 1): number => {
  if (!cartItems || cartItems.length === 0) {
    return 0;
  }

  const planDiscount = PLAN_DISCOUNTS[selectedPlan] || 0;
  
  const subtotal = cartItems.reduce((sum, item) => {
    const basePricePerMonth = item.panel.buildings?.preco_base || 200;
    const priceWithDiscount = basePricePerMonth * (1 - planDiscount);
    return sum + priceWithDiscount;
  }, 0);

  console.log("💰 [CheckoutUtils] SUBTOTAL BASEADO NOS PRÉDIOS:", {
    cartItemsCount: cartItems.length,
    planDiscount: `${planDiscount * 100}%`,
    subtotal
  });

  return subtotal;
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
