
/**
 * Formats a number as currency in BRL
 * @param value Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Calculates the final price with discount
 * @param price Original price
 * @param discountPercentage Discount percentage (0-100)
 * @returns Price with discount applied
 */
export const calculatePriceWithDiscount = (price: number, discountPercentage: number): number => {
  if (!discountPercentage || discountPercentage <= 0) return price;
  if (discountPercentage >= 100) return 0;
  
  const discountMultiplier = (100 - discountPercentage) / 100;
  return price * discountMultiplier;
};

/**
 * Ensures that the input can be spread in an object.
 * This is useful for handling JSON data that might be stored as a string.
 * @param input The input that needs to be spread-safe
 * @returns An object that can be safely spread
 */
export const ensureSpreadable = (input: any): object => {
  if (input === null || input === undefined) {
    return {};
  }
  
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch (e) {
      console.error('Failed to parse string as JSON in ensureSpreadable:', e);
      return {};
    }
  }
  
  if (typeof input === 'object') {
    return input;
  }
  
  return {};
};
