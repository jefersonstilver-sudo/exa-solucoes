
// CORREÇÃO COMPLETA: Sistema de Cálculo de Preços Unificado

import { Panel } from '@/types/panel';
import { PlanKey } from '@/types/checkout';
import { calculatePriceWithIntegrity } from './priceIntegrityManager';
import { logPriceCalculation } from './auditLogger';

interface CartItem {
  panel: Panel;
  duration: number;
  price?: number;
}

// FUNÇÃO CORRIGIDA: Cálculo de preço de painel individual
export const getPanelPrice = (panel: Panel, duration: number = 30): number => {
  if (!panel?.buildings?.preco_base) {
    console.warn("💰 [getPanelPrice] Preço base não encontrado para o painel:", panel?.id);
    return 0;
  }
  
  const basePrice = panel.buildings.preco_base;
  const months = duration / 30;
  const totalPrice = basePrice * months;
  
  console.log("💰 [getPanelPrice] CÁLCULO CORRIGIDO:", {
    panelId: panel.id,
    buildingName: panel.buildings?.nome,
    basePrice,
    duration,
    months,
    totalPrice,
    calculation: `R$ ${basePrice} × ${months} meses = R$ ${totalPrice}`
  });
  
  return totalPrice;
};

// FUNÇÃO PRINCIPAL CORRIGIDA: Cálculo de preço total com integridade
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

  // CORREÇÃO CRÍTICA: Calcular subtotal corretamente
  let subtotal = 0;
  cartItems.forEach((item, index) => {
    const basePrice = item.panel?.buildings?.preco_base || 0;
    
    if (basePrice <= 0) {
      console.error(`❌ [CheckoutUtils] Item ${index}: preço base inválido (${basePrice})`);
    }
    
    subtotal += basePrice;
    
    console.log(`💰 [CheckoutUtils] Item ${index} - CÁLCULO DETALHADO:`, {
      panelId: item.panel?.id,
      buildingName: item.panel?.buildings?.nome,
      basePrice,
      subtotalAtual: subtotal
    });
  });

  // CORREÇÃO CRÍTICA: Aplicar multiplicador do plano corretamente
  const planMultiplier = selectedPlan;
  let totalWithPlan = subtotal * planMultiplier;
  
  console.log("💰 [CheckoutUtils] CÁLCULO DO PLANO CORRIGIDO:", {
    subtotal,
    planMultiplier,
    totalWithPlan,
    calculation: `R$ ${subtotal} × ${planMultiplier} meses = R$ ${totalWithPlan}`
  });

  // Aplicar desconto se válido
  let finalPrice = totalWithPlan;
  if (couponValid && couponDiscount > 0) {
    const discountAmount = (totalWithPlan * couponDiscount) / 100;
    finalPrice = totalWithPlan - discountAmount;
    
    console.log("💰 [CheckoutUtils] DESCONTO APLICADO:", {
      totalWithPlan,
      couponDiscount,
      discountAmount,
      finalPrice
    });
  }

  // Arredondar para 2 casas decimais
  finalPrice = Math.round(finalPrice * 100) / 100;

  // VALIDAÇÃO CRÍTICA: Verificar se o preço faz sentido
  if (finalPrice <= 0) {
    console.error("❌ [CheckoutUtils] PREÇO FINAL INVÁLIDO:", {
      finalPrice,
      subtotal,
      planMultiplier,
      totalWithPlan
    });
  }

  // Detectar possível erro de divisão (valores muito baixos suspeitos)
  if (finalPrice < 0.01) {
    console.error("❌ [CheckoutUtils] VALOR SUSPEITO - Possível erro de cálculo:", {
      finalPrice,
      subtotal,
      planMultiplier,
      expectedMinimum: subtotal * planMultiplier
    });
  }

  console.log("💰 [CheckoutUtils] RESULTADO FINAL CORRIGIDO:", {
    selectedPlan,
    cartItemsCount: cartItems.length,
    finalPrice,
    calculation: `Subtotal: R$ ${subtotal} × ${planMultiplier} meses = R$ ${finalPrice}`,
    timestamp: new Date().toISOString()
  });

  // Log para auditoria
  logPriceCalculation('calculateTotalPrice-CORRECTED', {
    selectedPlan,
    cartItemsCount: cartItems.length,
    finalPrice,
    subtotal,
    planMultiplier,
    totalWithPlan,
    couponDiscount,
    couponValid,
    cartItems: cartItems.map(item => ({
      panelId: item.panel.id,
      buildingName: item.panel.buildings?.nome,
      preco_base: item.panel.buildings?.preco_base
    }))
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
    console.log("💰 [CheckoutUtils] Processando item do carrinho:", {
      panelId: item.panel?.id,
      buildingName: item.panel?.buildings?.nome,
      basePrice,
      total: total + basePrice
    });
    return total + basePrice;
  }, 0);

  console.log("💰 [CheckoutUtils] SUBTOTAL CALCULADO:", {
    cartItemsCount: cartItems.length,
    subtotal,
    timestamp: new Date().toISOString()
  });

  return subtotal;
};

// Calcular preços dinâmicos para exibição nos cartões de plano
export const getPlanWithDynamicPricing = (planKey: PlanKey, cartItems: CartItem[]): any => {
  if (!cartItems || cartItems.length === 0) {
    console.log("💰 [CheckoutUtils] Preços dinâmicos cancelados - carrinho vazio");
    return null;
  }

  const subtotal = calculateCartSubtotal(cartItems);
  const totalPrice = subtotal * planKey;
  const pricePerMonth = totalPrice / planKey;

  // Calcular economia em relação ao plano de 1 mês
  const oneMonthTotal = subtotal * 1;
  const savings = planKey > 1 ? (oneMonthTotal * planKey) - totalPrice : 0;

  const result = {
    dynamicPricePerMonth: pricePerMonth,
    dynamicTotalPrice: totalPrice,
    dynamicSavings: savings
  };

  console.log("💰 [CheckoutUtils] PREÇOS DINÂMICOS CALCULADOS:", {
    planKey,
    cartItemsCount: cartItems.length,
    subtotal,
    ...result,
    timestamp: new Date().toISOString()
  });

  // Log para auditoria
  logPriceCalculation('getPlanWithDynamicPricing', {
    planKey,
    cartItemsCount: cartItems.length,
    subtotal,
    dynamicPricing: result,
    cartItems: cartItems.map(item => ({
      panelId: item.panel.id,
      buildingName: item.panel.buildings?.nome,
      preco_base: item.panel.buildings?.preco_base
    }))
  });

  return result;
};

// Validar integridade de preços antes do pagamento
export const validatePriceIntegrity = (
  selectedPlan: PlanKey,
  cartItems: CartItem[],
  expectedTotal: number
): { isValid: boolean; calculatedTotal: number; difference: number } => {
  const calculatedTotal = calculateTotalPrice(selectedPlan, cartItems, 0, false);
  const difference = Math.abs(expectedTotal - calculatedTotal);
  const isValid = difference < 0.01; // Tolerância de 1 centavo

  console.log("🔍 [CheckoutUtils] VALIDAÇÃO DE INTEGRIDADE:", {
    selectedPlan,
    cartItemsCount: cartItems.length,
    expectedTotal,
    calculatedTotal,
    difference,
    isValid,
    timestamp: new Date().toISOString()
  });

  if (!isValid) {
    console.error("❌ [CheckoutUtils] DIVERGÊNCIA DE PREÇO DETECTADA!", {
      expectedTotal,
      calculatedTotal,
      difference
    });

    // Log crítico para auditoria
    logPriceCalculation('validatePriceIntegrity-ERROR', {
      selectedPlan,
      cartItemsCount: cartItems.length,
      expectedTotal,
      calculatedTotal,
      difference,
      criticalError: true
    });
  }

  return {
    isValid,
    calculatedTotal,
    difference
  };
};
