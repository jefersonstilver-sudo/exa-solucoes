
import { Panel } from '@/types/panel';

export const useCartPriceCalculator = () => {
  // Calculate price based on panel info and duration
  const calculatePrice = (panel: Panel, days: number) => {
    const basePrice = 100; // Base daily rate
    const locationFactor = panel.buildings?.bairro === 'Vila A' ? 1.5 : 
                          panel.buildings?.bairro === 'Centro' ? 1.3 : 1;
    
    // Apply discount based on duration
    let discount = 0;
    if (days >= 365) discount = 0.25;
    else if (days >= 180) discount = 0.15;
    else if (days >= 90) discount = 0.10;
    else if (days >= 60) discount = 0.05;
    
    const rawPrice = basePrice * locationFactor * days;
    return Math.round(rawPrice * (1 - discount));
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return {
    calculatePrice,
    formatCurrency
  };
};

export default useCartPriceCalculator;
