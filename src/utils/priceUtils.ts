
/**
 * Calculates the price per month based on plan duration
 * @param months Number of months for the plan
 * @returns Price per month in BRL
 */
export const getPricePerMonth = (months: number): number => {
  if (months >= 12) return 180;
  if (months >= 6) return 200;
  if (months >= 3) return 220;
  return 250; // Default 1 month price
};

/**
 * Gets the benefits associated with a specific plan duration
 * @param months Number of months for the plan
 * @returns Array of benefit descriptions
 */
export const getPlanBenefits = (months: number): string[] => {
  if (months >= 12) {
    return [
      '🎥 1 vídeo por mês produzido pela Indexa',
      '🎬 Vídeo institucional gratuito',
      '🎞️ Bônus de exibição ininterrupta de 30s'
    ];
  }
  if (months >= 6) {
    return ['🎥 1 vídeo por mês produzido pela Indexa'];
  }
  if (months >= 3) {
    return ['🎥 1 vídeo por mês produzido pela Indexa'];
  }
  return [];
};

/**
 * Calculates the total price for a plan
 * @param months Number of months
 * @param quantity Number of panels
 * @returns Total price in BRL
 */
export const calculatePlanPrice = (months: number, quantity: number = 1): number => {
  const pricePerMonth = getPricePerMonth(months);
  return pricePerMonth * months * quantity;
};

/**
 * Calculates price with a percentage discount applied
 * @param price Original price
 * @param discountPercentage Percentage discount to apply
 * @returns Discounted price
 */
export const calculatePriceWithDiscount = (price: number, discountPercentage: number): number => {
  if (discountPercentage <= 0 || discountPercentage >= 100) {
    return price;
  }
  
  return price * (1 - discountPercentage / 100);
};

/**
 * Ensures an object can be spread
 * Useful when dealing with potentially null/undefined JSON objects from database
 * @param obj Object to check
 * @returns Safe object for spreading
 */
export const ensureSpreadable = (obj: any): Record<string, any> => {
  if (obj && typeof obj === 'object') {
    return obj;
  }
  return {};
};

/**
 * Format price to Brazilian currency format
 * @param price Price to format
 * @returns Formatted price string
 */
export const formatCurrency = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

/**
 * Convert days to months (approximate)
 * @param days Number of days
 * @returns Approximate number of months
 */
export const daysToMonths = (days: number): number => {
  return Math.round(days / 30);
};

/**
 * Convert months to days
 * @param months Number of months
 * @returns Equivalent days
 */
export const monthsToDays = (months: number): number => {
  return months * 30;
};
