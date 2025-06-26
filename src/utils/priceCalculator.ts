// Sistema Centralizado de Cálculo de Preços - CORRIGIDO

import { CartItem } from '@/types/cart';
import { PlanKey } from '@/types/checkout';

// PREÇOS BASE FIXOS - ÚNICA FONTE DA VERDADE
const PLAN_PRICES: Record<PlanKey, number> = {
  1: 200,   // R$ 200/mês
  3: 160,   // R$ 160/mês (20% desconto)
  6: 140,   // R$ 140/mês (30% desconto)
  12: 125   // R$ 125/mês (37.5% desconto)
};

// PIX tem 5% de desconto sobre o total
const PIX_DISCOUNT_RATE = 0.05;

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

  // CORREÇÃO CRÍTICA: Cálculo baseado no preço base dos prédios, não multiplicando por meses
  let subtotal = 0;
  
  // Somar o preço base de cada painel (já é o valor mensal total)
  cartItems.forEach(item => {
    const precoBase = item.panel?.buildings?.preco_base || PLAN_PRICES[selectedPlan];
    subtotal += precoBase;
  });
  
  console.log('💰 [PriceCalculator] CÁLCULO CORRIGIDO:', {
    selectedPlan,
    panelCount: cartItems.length,
    subtotal,
    cartItems: cartItems.map(item => ({
      panelId: item.panel.id,
      precoBase: item.panel?.buildings?.preco_base || 'usando padrão',
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
  const finalPrice = afterCoupon - pixDiscount;
  
  const calculation = `${cartItems.length} painéis (R$ ${subtotal.toFixed(2)})${couponDiscountPercent > 0 ? ` - ${couponDiscountPercent}% cupom` : ''}${applyPixDiscount ? ` - 5% PIX` : ''} = R$ ${finalPrice.toFixed(2)}`;
  
  console.log('💰 [PriceCalculator] RESULTADO FINAL:', {
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
  console.log('💰 [calculatePixPrice] VALOR FINAL PIX:', result.finalPrice);
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
  return price > 0 && price >= 10; // Preço mínimo de R$ 10
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
