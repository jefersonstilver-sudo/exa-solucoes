
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
