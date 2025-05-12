
/**
 * Calculate price with percentage discount
 */
export const calculatePriceWithDiscount = (originalPrice: number, discountPercentage: number): number => {
  if (discountPercentage <= 0 || discountPercentage > 100) {
    return originalPrice;
  }
  
  return originalPrice * (1 - discountPercentage / 100);
};

/**
 * Calculate monthly price based on plan duration
 */
export const calculateMonthlyPrice = (
  basePricePerMonth: number,
  planDuration: number
): number => {
  switch (planDuration) {
    case 1:
      return basePricePerMonth;
    case 3:
      return basePricePerMonth * 0.88; // 12% discount
    case 6:
      return basePricePerMonth * 0.80; // 20% discount
    case 12:
      return basePricePerMonth * 0.72; // 28% discount
    default:
      return basePricePerMonth;
  }
};

/**
 * Calculate price for a specific panel and plan duration
 */
export const calculatePanelPrice = (
  basePricePerMonth: number,
  planDuration: number,
  couponDiscountPercentage: number = 0
): number => {
  let price = calculateMonthlyPrice(basePricePerMonth, planDuration) * planDuration;
  
  if (couponDiscountPercentage > 0) {
    price = calculatePriceWithDiscount(price, couponDiscountPercentage);
  }
  
  return price;
};

/**
 * Ensure an object is safe to spread
 * This utility function ensures that a value is an object that can be safely spread
 */
export const ensureSpreadable = (value: any): Record<string, any> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
};
