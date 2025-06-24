
// Sistema Centralizado de Cálculo de Preços - Baseado nos Preços Reais dos Prédios

import { CartItem } from '@/types/cart';
import { PlanKey } from '@/types/checkout';

// DESCONTOS POR PLANO - aplicados sobre o preço base real
const PLAN_DISCOUNTS: Record<PlanKey, number> = {
  1: 0,      // 0% desconto - preço base integral
  3: 0.20,   // 20% desconto
  6: 0.30,   // 30% desconto
  12: 0.375  // 37.5% desconto
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
  applyPixDiscount: boolean = false
): PriceCalculationResult => {
  if (!selectedPlan || !cartItems || cartItems.length === 0) {
    return {
      subtotal: 0,
      pixDiscount: 0,
      finalPrice: 0,
      calculation: 'Dados insuficientes'
    };
  }

  // Cálculo baseado no preço real de cada prédio
  let subtotal = 0;
  const planMonths = selectedPlan;
  const planDiscount = PLAN_DISCOUNTS[selectedPlan];

  cartItems.forEach(item => {
    // Usar o preço base real do prédio
    const basePrice = item.panel?.buildings?.preco_base || 280; // fallback para R$ 280
    
    // Aplicar desconto do plano
    const discountedMonthlyPrice = basePrice * (1 - planDiscount);
    
    // Multiplicar pelos meses do plano
    const itemTotal = discountedMonthlyPrice * planMonths;
    
    subtotal += itemTotal;
  });
  
  // Aplicar desconto de cupom se houver
  let afterCoupon = subtotal;
  if (couponDiscountPercent > 0) {
    afterCoupon = subtotal * (1 - couponDiscountPercent / 100);
  }
  
  // Aplicar desconto PIX se solicitado
  const pixDiscount = applyPixDiscount ? afterCoupon * PIX_DISCOUNT_RATE : 0;
  const finalPrice = afterCoupon - pixDiscount;
  
  const calculation = `${cartItems.length} painéis com desconto ${planDiscount * 100}% do plano × ${planMonths} meses${couponDiscountPercent > 0 ? ` - ${couponDiscountPercent}% cupom` : ''}${applyPixDiscount ? ` - 5% PIX` : ''} = R$ ${finalPrice.toFixed(2)}`;
  
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
  return result.finalPrice;
};

// Função específica para preço regular no carrinho (SEM desconto PIX)
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
  return price > 0 && price >= 0.01; // Preço mínimo de R$ 0,01
};

// Função para calcular preço individual de um item
export const calculateItemPrice = (
  selectedPlan: PlanKey,
  cartItem: CartItem,
  couponDiscountPercent: number = 0,
  applyPixDiscount: boolean = false
): number => {
  const result = calculatePrice(selectedPlan, [cartItem], couponDiscountPercent, applyPixDiscount);
  return result.finalPrice;
};
