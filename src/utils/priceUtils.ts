
// Utility functions for price calculations and formatting

/**
 * Format a number as currency (BRL)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Calculate price with discount
 */
export const calculatePriceWithDiscount = (
  originalPrice: number,
  discountPercentage: number
): number => {
  if (!originalPrice || originalPrice <= 0) return 0;
  if (!discountPercentage || discountPercentage <= 0) return originalPrice;
  
  const discount = originalPrice * (discountPercentage / 100);
  return Math.max(0, originalPrice - discount);
};

/**
 * Ensure an object can be safely spread
 * Used for ensuring objects can be safely spread in component props
 */
export const ensureSpreadable = <T extends object>(obj: T | null | undefined): T => {
  return obj || {} as T;
};

/**
 * Calculate percentage discount between two values
 */
export const calculateDiscountPercentage = (
  originalPrice: number,
  discountedPrice: number
): number => {
  if (!originalPrice || originalPrice <= 0) return 0;
  if (!discountedPrice || discountedPrice >= originalPrice) return 0;
  
  const discountAmount = originalPrice - discountedPrice;
  return Math.round((discountAmount / originalPrice) * 100);
};

/**
 * Format a discount percentage as a string
 */
export const formatDiscountPercentage = (percentage: number): string => {
  if (!percentage || percentage <= 0) return '';
  return `-${percentage}%`;
};
