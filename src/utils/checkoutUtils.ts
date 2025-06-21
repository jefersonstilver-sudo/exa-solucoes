// CORREÇÃO COMPLETA: Sistema de Cálculo de Preços Unificado com preços corretos

import { Panel } from '@/types/panel';
import { PlanKey } from '@/types/checkout';
import { logPriceCalculation } from './auditLogger';

interface CartItem {
  panel: Panel;
  duration: number;
  price?: number;
}

// PREÇOS FIXOS POR PLANO (em reais por mês por painel)
const PLAN_PRICES = {
  1: 200,   // R$ 200/mês
  3: 160,   // R$ 160/mês (20% desconto)
  6: 140,   // R$ 140/mês (30% desconto)
  12: 125   // R$ 125/mês (37.5% desconto)
};

// FUNÇÃO ADICIONADA: Calcular preço de um painel individual (compatibilidade)
export const getPanelPrice = (panel: Panel, duration: number = 30): number => {
  // Usar preço base do plano mensal como padrão para compatibilidade
  const pricePerMonth = PLAN_PRICES[1]; // R$ 200/mês
  const months = duration / 30;
  const totalPrice = pricePerMonth * months;
  
  console.log("💰 [getPanelPrice] CÁLCULO INDIVIDUAL:", {
    panelId: panel.id,
    duration,
    months,
    pricePerMonth,
    totalPrice,
    calculation: `R$ ${pricePerMonth}/mês × ${months} meses = R$ ${totalPrice}`
  });
  
  return totalPrice;
};

// FUNÇÃO CORRIGIDA: Cálculo de preço total com preços fixos por plano
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

  const pricePerMonth = PLAN_PRICES[selectedPlan];
  
  if (!pricePerMonth) {
    console.error("💰 [CheckoutUtils] Preço não encontrado para o plano:", selectedPlan);
    return 0;
  }

  // CORREÇÃO: Total = número de painéis × preço mensal × meses do plano
  const totalPanels = cartItems.length;
  const totalWithPlan = totalPanels * pricePerMonth * selectedPlan;
  
  console.log("💰 [CheckoutUtils] CÁLCULO CORRIGIDO:", {
    selectedPlan,
    pricePerMonth,
    totalPanels,
    planMonths: selectedPlan,
    totalWithPlan,
    calculation: `${totalPanels} painéis × R$ ${pricePerMonth}/mês × ${selectedPlan} meses = R$ ${totalWithPlan}`
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

  // Arredondar para 2 casas decimais
  finalPrice = Math.round(finalPrice * 100) / 100;

  console.log("💰 [CheckoutUtils] RESULTADO FINAL CORRIGIDO:", {
    selectedPlan,
    cartItemsCount: cartItems.length,
    finalPrice,
    pricePerMonth,
    withDiscount: couponValid && couponDiscount > 0
  });

  return finalPrice;
};

// NOVA FUNÇÃO: Calcular preços dinâmicos para exibição nos cartões de plano
export const getPlanWithDynamicPricing = (planKey: PlanKey, cartItems: CartItem[]): any => {
  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  const pricePerMonth = PLAN_PRICES[planKey];
  const totalPanels = cartItems.length;
  
  // Total = painéis × preço mensal × meses do plano
  const totalPrice = totalPanels * pricePerMonth * planKey;
  const pricePerMonthTotal = totalPanels * pricePerMonth;
  
  // Calcular economia comparado ao plano mensal
  const monthlyPlanTotal = totalPanels * PLAN_PRICES[1] * planKey;
  const savings = planKey > 1 ? monthlyPlanTotal - totalPrice : 0;

  console.log("💰 [getPlanWithDynamicPricing] CÁLCULO CORRIGIDO:", {
    planKey,
    totalPanels,
    pricePerMonth,
    planMonths: planKey,
    totalPrice,
    calculation: `${totalPanels} × R$ ${pricePerMonth} × ${planKey} = R$ ${totalPrice}`
  });

  return {
    dynamicPricePerMonth: pricePerMonthTotal,
    dynamicTotalPrice: totalPrice,
    dynamicSavings: savings
  };
};

// Função para obter preço por mês de um plano específico
export const getPlanMonthlyPrice = (planKey: PlanKey): number => {
  return PLAN_PRICES[planKey] || 0;
};

// Cálculo do subtotal do carrinho (baseado nos preços dos planos)
export const calculateCartSubtotal = (cartItems: CartItem[], selectedPlan: PlanKey = 1): number => {
  if (!cartItems || cartItems.length === 0) {
    return 0;
  }

  const pricePerMonth = PLAN_PRICES[selectedPlan];
  const subtotal = cartItems.length * pricePerMonth;

  console.log("💰 [CheckoutUtils] SUBTOTAL CALCULADO:", {
    cartItemsCount: cartItems.length,
    pricePerMonth,
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
