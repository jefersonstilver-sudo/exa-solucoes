
/**
 * Calculate price with discount
 * @param price Original price
 * @param discountPercentage Discount percentage (0-100)
 * @returns Price after discount
 */
export const calculatePriceWithDiscount = (price: number, discountPercentage: number): number => {
  if (discountPercentage <= 0 || discountPercentage > 100) return price;
  return price * (1 - discountPercentage / 100);
};

/**
 * Calculate monthly price based on plan duration
 * @param basePricePerMonth Base monthly price (R$250)
 * @param planDuration Duration in months (1, 3, 6, or 12)
 * @returns Price per month for the selected plan
 */
export const calculateMonthlyPrice = (
  basePricePerMonth: number,
  planDuration: number
): number => {
  switch (planDuration) {
    case 3:
      return 220; // 3 months plan: R$220/month
    case 6:
      return 200; // 6 months plan: R$200/month
    case 12:
      return 180; // 12 months plan: R$180/month
    default:
      return 250; // Default 1 month plan: R$250/month
  }
};

/**
 * Get plan benefits based on duration
 * @param planDuration Duration in months (1, 3, 6, or 12)
 * @returns Array of benefits for the selected plan
 */
export const getPlanBenefits = (planDuration: number): string[] => {
  switch (planDuration) {
    case 3:
    case 6:
      return ['🎥 1 vídeo por mês produzido pela Indexa'];
    case 12:
      return [
        '🎥 1 vídeo por mês produzido pela Indexa',
        '🎬 Vídeo institucional',
        '🎞️ Bônus de exibição ininterrupta de 30s'
      ];
    default:
      return [];
  }
};

/**
 * Calculate discount percentage based on plan duration
 * @param planDuration Duration in months (1, 3, 6, or 12)
 * @returns Discount percentage for the selected plan
 */
export const getPlanDiscountPercentage = (planDuration: number): number => {
  switch (planDuration) {
    case 3:
      return 12; // 12% discount
    case 6:
      return 20; // 20% discount
    case 12:
      return 28; // 28% discount
    default:
      return 0; // No discount for 1 month
  }
};

/**
 * Ensures that a value can be safely spread in an object
 * @param value The value to check
 * @returns A safe object to spread
 */
export const ensureSpreadable = (value: any): Record<string, any> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return {};
};
