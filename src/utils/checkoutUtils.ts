
// CORREÇÃO COMPLETA: Sistema de Cálculo de Preços Unificado com preços corretos

import { Panel } from '@/types/panel';
import { PlanKey } from '@/types/checkout';
import { logPriceCalculation } from './auditLogger';
import { BASE_PRICE_PER_PANEL } from '@/constants/checkoutConstants';

interface CartItem {
  panel: Panel;
  duration: number;
  price?: number;
}

// NOVA FUNÇÃO: Calcular preço de um painel individual
export const getPanelPrice = (panel: Panel, duration: number = 30): number => {
  if (!panel || !panel.buildings?.preco_base) {
    console.warn("⚠️ [getPanelPrice] Panel ou preço base não encontrado:", { panel });
    return 0;
  }

  const basePrice = panel.buildings.preco_base;
  const months = duration / 30;
  const totalPrice = basePrice * months;

  console.log("💰 [getPanelPrice] Cálculo do preço do painel:", {
    panelId: panel.id,
    basePrice,
    duration,
    months,
    totalPrice
  });

  return totalPrice;
};

// FUNÇÃO CORRIGIDA: Cálculo de preço total com desconto aplicado corretamente e preços específicos
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

  console.log("💰 [CheckoutUtils] INICIANDO CÁLCULO COM PREÇOS CORRIGIDOS:", {
    selectedPlan,
    cartItemsCount: cartItems.length,
    couponDiscount,
    couponValid,
    timestamp: new Date().toISOString()
  });

  // Preços específicos por plano conforme especificação
  const pricePerMonth = {
    1: 200,   // R$ 200/mês
    3: 160,   // R$ 160/mês (R$ 200 - 20%)
    6: 140,   // R$ 140/mês 
    12: 125   // R$ 125/mês
  };

  const monthlyPrice = pricePerMonth[selectedPlan];
  
  if (!monthlyPrice) {
    console.error("💰 [CheckoutUtils] Preço não encontrado para o plano:", selectedPlan);
    return 0;
  }

  // CORREÇÃO: Calcular total baseado no número de painéis × preço mensal × meses
  const totalPanels = cartItems.length;
  const totalWithPlan = totalPanels * monthlyPrice * selectedPlan;
  
  console.log("💰 [CheckoutUtils] CÁLCULO CORRIGIDO:", {
    selectedPlan,
    monthlyPrice,
    totalPanels,
    planMonths: selectedPlan,
    totalWithPlan,
    calculation: `${totalPanels} painéis × R$ ${monthlyPrice}/mês × ${selectedPlan} meses = R$ ${totalWithPlan}`
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
    pricePerMonth: monthlyPrice,
    withDiscount: couponValid && couponDiscount > 0
  });

  return finalPrice;
};

// Cálculo do subtotal do carrinho (baseado no preço base)
export const calculateCartSubtotal = (cartItems: CartItem[]): number => {
  if (!cartItems || cartItems.length === 0) {
    return 0;
  }

  const subtotal = cartItems.reduce((total, item) => {
    const basePrice = item.panel?.buildings?.preco_base || BASE_PRICE_PER_PANEL;
    return total + basePrice;
  }, 0);

  console.log("💰 [CheckoutUtils] SUBTOTAL CALCULADO:", {
    cartItemsCount: cartItems.length,
    subtotal
  });

  return subtotal;
};

// CORREÇÃO: Calcular preços dinâmicos para exibição nos cartões de plano
export const getPlanWithDynamicPricing = (planKey: PlanKey, cartItems: CartItem[]): any => {
  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  // Usar os preços específicos definidos
  const pricePerMonth = {
    1: 200,   // R$ 200/mês
    3: 160,   // R$ 160/mês 
    6: 140,   // R$ 140/mês 
    12: 125   // R$ 125/mês
  };

  const monthlyPricePerPanel = pricePerMonth[planKey];
  const totalPanels = cartItems.length;
  
  // CORREÇÃO: Total = painéis × preço mensal × meses do plano
  const totalPrice = totalPanels * monthlyPricePerPanel * planKey;
  const pricePerMonthTotal = totalPanels * monthlyPricePerPanel;
  
  // Calcular economia comparado ao plano mensal
  const monthlyPlanTotal = totalPanels * pricePerMonth[1] * planKey;
  const savings = planKey > 1 ? monthlyPlanTotal - totalPrice : 0;

  console.log("💰 [getPlanWithDynamicPricing] CÁLCULO CORRIGIDO PARA PLANO ANUAL:", {
    planKey,
    totalPanels,
    monthlyPricePerPanel,
    planMonths: planKey,
    totalPrice,
    calculation: `${totalPanels} × R$ ${monthlyPricePerPanel} × ${planKey} = R$ ${totalPrice}`,
    expected12MonthsResult: planKey === 12 ? "Deve ser R$ 1.500 para 1 painel" : "N/A"
  });

  return {
    dynamicPricePerMonth: pricePerMonthTotal,
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
