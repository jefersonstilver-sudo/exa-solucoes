/**
 * Utility functions for building pricing calculations
 * Centralized logic for manual prices vs automatic discount calculations
 */

export type PlanDuration = 1 | 3 | 6 | 12;

// Fixed discounts when manual prices are not defined
const FALLBACK_DISCOUNTS: Record<PlanDuration, number> = {
  1: 0,       // 0% discount
  3: 0.20,    // 20% discount
  6: 0.30,    // 30% discount
  12: 0.375   // 37.5% discount
};

export interface BuildingWithPrices {
  id?: string;
  nome?: string;
  preco_base?: number | null;
  preco_trimestral?: number | null;
  preco_semestral?: number | null;
  preco_anual?: number | null;
  quantidade_telas?: number | null;
  numero_elevadores?: number | null;
  [key: string]: any;
}

export interface PricingResult {
  totalPrice: number;
  pricePerMonth: number;
  usedManualPrice: boolean;
  originalPrice: number;  // Price without discount (preco_base * months)
  discountPercent: number; // Actual discount percentage
  savings: number;  // Amount saved
}

/**
 * Get the price for a single building based on the selected plan
 * Uses manual price if defined, otherwise calculates with fallback discount
 */
export const getBuildingPriceForPlan = (
  building: BuildingWithPrices | null | undefined,
  planDuration: PlanDuration
): PricingResult => {
  const precoBase = building?.preco_base || 200;
  const originalPrice = precoBase * planDuration;
  
  let totalPrice: number;
  let usedManualPrice = false;
  
  switch (planDuration) {
    case 3:
      if (building?.preco_trimestral && building.preco_trimestral > 0) {
        totalPrice = building.preco_trimestral;
        usedManualPrice = true;
      } else {
        totalPrice = originalPrice * (1 - FALLBACK_DISCOUNTS[3]);
      }
      break;
    case 6:
      if (building?.preco_semestral && building.preco_semestral > 0) {
        totalPrice = building.preco_semestral;
        usedManualPrice = true;
      } else {
        totalPrice = originalPrice * (1 - FALLBACK_DISCOUNTS[6]);
      }
      break;
    case 12:
      if (building?.preco_anual && building.preco_anual > 0) {
        totalPrice = building.preco_anual;
        usedManualPrice = true;
      } else {
        totalPrice = originalPrice * (1 - FALLBACK_DISCOUNTS[12]);
      }
      break;
    case 1:
    default:
      totalPrice = precoBase;
      break;
  }
  
  const pricePerMonth = totalPrice / planDuration;
  const savings = originalPrice - totalPrice;
  const discountPercent = originalPrice > 0 ? ((originalPrice - totalPrice) / originalPrice) * 100 : 0;
  
  return {
    totalPrice,
    pricePerMonth,
    usedManualPrice,
    originalPrice,
    discountPercent: Math.round(discountPercent * 10) / 10, // Round to 1 decimal
    savings
  };
};

/**
 * Calculate total price for multiple buildings
 */
export const calculateBuildingsPrice = (
  buildings: BuildingWithPrices[],
  planDuration: PlanDuration
): {
  totalPrice: number;
  pricePerMonth: number;
  originalPrice: number;
  averageDiscountPercent: number;
  savings: number;
  hasAnyManualPrice: boolean;
} => {
  if (!buildings || buildings.length === 0) {
    return {
      totalPrice: 0,
      pricePerMonth: 0,
      originalPrice: 0,
      averageDiscountPercent: 0,
      savings: 0,
      hasAnyManualPrice: false
    };
  }
  
  let totalPrice = 0;
  let originalPrice = 0;
  let hasAnyManualPrice = false;
  
  buildings.forEach(building => {
    const result = getBuildingPriceForPlan(building, planDuration);
    totalPrice += result.totalPrice;
    originalPrice += result.originalPrice;
    if (result.usedManualPrice) {
      hasAnyManualPrice = true;
    }
  });
  
  const pricePerMonth = totalPrice / planDuration;
  const savings = originalPrice - totalPrice;
  const averageDiscountPercent = originalPrice > 0 
    ? Math.round(((originalPrice - totalPrice) / originalPrice) * 1000) / 10 
    : 0;
  
  return {
    totalPrice,
    pricePerMonth,
    originalPrice,
    averageDiscountPercent,
    savings,
    hasAnyManualPrice
  };
};

/**
 * Get the real discount percentage for a plan based on building prices
 * Returns the actual discount, not the fixed fallback
 */
export const getRealDiscountPercent = (
  building: BuildingWithPrices | null | undefined,
  planDuration: PlanDuration
): number => {
  const result = getBuildingPriceForPlan(building, planDuration);
  return result.discountPercent;
};

/**
 * Get fallback discount percentage (fixed values)
 */
export const getFallbackDiscountPercent = (planDuration: PlanDuration): number => {
  return FALLBACK_DISCOUNTS[planDuration] * 100;
};

/**
 * Format plan pricing for display
 */
export const formatPlanPricing = (
  buildings: BuildingWithPrices[],
  planDuration: PlanDuration
): {
  displayPrice: string;
  displayTotal: string;
  displayDiscount: string;
  displaySavings: string;
} => {
  const result = calculateBuildingsPrice(buildings, planDuration);
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return {
    displayPrice: formatCurrency(result.pricePerMonth),
    displayTotal: formatCurrency(result.totalPrice),
    displayDiscount: result.averageDiscountPercent > 0 ? `-${result.averageDiscountPercent}%` : '',
    displaySavings: formatCurrency(result.savings)
  };
};

/**
 * Calculate suggested monthly value based on buildings and plan
 */
export const calculateSuggestedMonthlyValue = (
  buildings: BuildingWithPrices[],
  planDuration: PlanDuration
): number => {
  const result = calculateBuildingsPrice(buildings, planDuration);
  return result.pricePerMonth;
};

/**
 * Calculate suggested total value based on buildings and plan
 */
export const calculateSuggestedTotalValue = (
  buildings: BuildingWithPrices[],
  planDuration: PlanDuration
): number => {
  const result = calculateBuildingsPrice(buildings, planDuration);
  return result.totalPrice;
};
