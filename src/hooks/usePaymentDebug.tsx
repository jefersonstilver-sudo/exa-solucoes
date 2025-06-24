
import { useEffect } from 'react';
import { CartItem } from '@/types/cart';
import { calculatePixPrice } from '@/utils/priceCalculator';

export const usePaymentDebug = (cartItems: CartItem[], totalPrice: number, context: string) => {
  useEffect(() => {
    const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1');
    
    console.log(`💳 [${context}] PAYMENT DEBUG:`, {
      timestamp: new Date().toISOString(),
      context,
      totalPrice,
      cartItemsCount: cartItems?.length || 0,
      selectedPlan,
      cartItems: cartItems?.map(item => ({
        id: item.id,
        panelId: item.panel?.id,
        buildingName: item.panel?.buildings?.nome,
        duration: item.duration,
        // CORRIGIDO: Calcular preço dinamicamente
        calculatedPrice: calculatePixPrice(selectedPlan, [item], 0)
      })) || [],
      // CORRIGIDO: Calcular total usando calculador centralizado
      calculatedTotal: calculatePixPrice(selectedPlan, cartItems, 0),
      localStorage: {
        selectedPlan: localStorage.getItem('selectedPlan'),
        panelCart: localStorage.getItem('panelCart'),
        simple_cart: localStorage.getItem('simple_cart')
      }
    });
  }, [cartItems, totalPrice, context]);

  const debugPayment = () => {
    console.log(`🔍 [${context}] MANUAL PAYMENT DEBUG:`, {
      timestamp: new Date().toISOString(),
      context,
      cartItems,
      totalPrice,
      allLocalStorage: Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>)
    });
  };

  return { debugPayment };
};
