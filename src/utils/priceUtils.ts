
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const calculateDiscount = (originalPrice: number, discountPercentage: number): number => {
  return originalPrice * (discountPercentage / 100);
};

export const calculateDiscountedPrice = (originalPrice: number, discountPercentage: number): number => {
  return originalPrice - calculateDiscount(originalPrice, discountPercentage);
};
