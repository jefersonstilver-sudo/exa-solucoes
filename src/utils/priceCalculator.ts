
// Sistema Centralizado de Cálculo de Preços - CORRIGIDO COM MULTIPLICAÇÃO POR MESES

import { CartItem } from '@/types/cart';
import { PlanKey } from '@/types/checkout';

// PREÇOS BASE FIXOS - ÚNICA FONTE DA VERDADE (valores mensais)
const PLAN_PRICES: Record<PlanKey, number> = {
  1: 200,   // R$ 200/mês
  3: 160,   // R$ 160/mês (20% desconto)
  6: 140,   // R$ 140/mês (30% desconto)
  12: 125   // R$ 125/mês (37.5% desconto)
};

// PIX tem 5% de desconto sobre o total
const PIX_DISCOUNT_RATE = 0.05;

// 🆕 FASE 4: Valores mínimos do Stripe (em reais)
export const MINIMUM_ORDER_VALUE_PIX = 0.50; // Mínimo Stripe PIX
export const MINIMUM_ORDER_VALUE_CARD = 1.00; // Mínimo Stripe Cartão
export const MINIMUM_ORDER_VALUE = 0.05; // Mínimo genérico (manter compatibilidade)

// Função auxiliar para obter valor mínimo por método
export const getMinimumOrderValue = (paymentMethod: 'pix' | 'credit_card'): number => {
  return paymentMethod === 'pix' ? MINIMUM_ORDER_VALUE_PIX : MINIMUM_ORDER_VALUE_CARD;
};

interface PriceCalculationResult {
  subtotal: number;
  pixDiscount: number;
  finalPrice: number;
  calculation: string;
}

export const calculatePrice = (
  selectedPlan: PlanKey,
  cartItems: CartItem[],
  couponDiscountPercent: number = 0,
  applyPixDiscount: boolean = true
): PriceCalculationResult => {
  if (!selectedPlan || !cartItems || cartItems.length === 0) {
    return {
      subtotal: 0,
      pixDiscount: 0,
      finalPrice: 0,
      calculation: 'Dados insuficientes'
    };
  }

  // CORREÇÃO CRÍTICA: Calcular valor total considerando meses do plano
  let subtotalMensal = 0;
  
  // Somar o preço base mensal de cada painel
  cartItems.forEach(item => {
    const precoBaseMensal = item.panel?.buildings?.preco_base || PLAN_PRICES[selectedPlan];
    subtotalMensal += precoBaseMensal;
  });
  
  // CORREÇÃO: Multiplicar pelo número de meses do plano
  const subtotal = subtotalMensal * selectedPlan;
  
  console.log('💰 [PriceCalculator] CÁLCULO CORRIGIDO COM MESES:', {
    selectedPlan,
    panelCount: cartItems.length,
    subtotalMensal,
    mesesPlano: selectedPlan,
    subtotalTotal: subtotal,
    cartItems: cartItems.map(item => ({
      panelId: item.panel.id,
      precoBaseMensal: item.panel?.buildings?.preco_base || 'usando padrão',
      buildingName: item.panel?.buildings?.nome
    }))
  });
  
  // Aplicar desconto de cupom se houver
  let afterCoupon = subtotal;
  if (couponDiscountPercent > 0) {
    afterCoupon = subtotal * (1 - couponDiscountPercent / 100);
  }
  
  // Aplicar desconto PIX se solicitado
  const pixDiscount = applyPixDiscount ? afterCoupon * PIX_DISCOUNT_RATE : 0;
  let finalPrice = afterCoupon - pixDiscount;
  
  // GARANTIR valor mínimo - nunca menos que R$ 0,05
  finalPrice = Math.max(finalPrice, MINIMUM_ORDER_VALUE);
  
  const calculation = `${cartItems.length} painéis × ${selectedPlan} meses (R$ ${subtotal.toFixed(2)})${couponDiscountPercent > 0 ? ` - ${couponDiscountPercent}% cupom` : ''}${applyPixDiscount ? ` - 5% PIX` : ''} = R$ ${finalPrice.toFixed(2)}`;
  
  console.log('💰 [PriceCalculator] RESULTADO FINAL COM MESES:', {
    subtotalMensal,
    mesesPlano: selectedPlan,
    subtotal,
    couponDiscountPercent,
    afterCoupon,
    pixDiscount,
    finalPrice,
    calculation
  });
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    pixDiscount: Math.round(pixDiscount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    calculation
  };
};

// Função específica para PIX (sempre com desconto)
export const calculatePixPrice = (
  selectedPlan: PlanKey,
  cartItems: CartItem[],
  couponDiscountPercent: number = 0
): number => {
  const result = calculatePrice(selectedPlan, cartItems, couponDiscountPercent, true);
  console.log('💰 [calculatePixPrice] VALOR FINAL PIX COM MESES:', result.finalPrice);
  return result.finalPrice;
};

// Função específica para outros métodos (sem desconto PIX)
export const calculateRegularPrice = (
  selectedPlan: PlanKey,
  cartItems: CartItem[],
  couponDiscountPercent: number = 0
): number => {
  const result = calculatePrice(selectedPlan, cartItems, couponDiscountPercent, false);
  return result.finalPrice;
};

// Validar se o preço está correto
export const validatePrice = (price: number): boolean => {
  return price > 0 && price >= MINIMUM_ORDER_VALUE; // Preço mínimo de R$ 0,05
};

// NOVA FUNÇÃO: Obter preços dos planos para exibição
export const getPlanPrices = (): Record<PlanKey, number> => {
  return { ...PLAN_PRICES };
};

// NOVA FUNÇÃO: Calcular desconto do plano
export const calculatePlanDiscount = (planKey: PlanKey): number => {
  const basePrice = PLAN_PRICES[1]; // Preço base mensal
  const planPrice = PLAN_PRICES[planKey];
  return planKey === 1 ? 0 : Math.round(((basePrice - planPrice) / basePrice) * 100);
};
