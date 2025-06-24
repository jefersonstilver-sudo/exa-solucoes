
import { useEffect } from 'react';
import { CartItem } from '@/types/cart';
import { calculatePixPrice } from '@/utils/priceCalculator';

export const useCartDebug = (cartItems: CartItem[], context: string) => {
  useEffect(() => {
    const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1');
    
    console.log(`🛒 [${context}] CART DEBUG:`, {
      timestamp: new Date().toISOString(),
      context,
      cartItemsCount: cartItems?.length || 0,
      localStorage: {
        panelCart: localStorage.getItem('panelCart'),
        simple_cart: localStorage.getItem('simple_cart'),
        selectedPlan: localStorage.getItem('selectedPlan')
      },
      cartItems: cartItems?.map(item => ({
        id: item.id || 'no-id',
        panelId: item.panel?.id,
        buildingName: item.panel?.buildings?.nome,
        duration: item.duration,
        // CORRIGIDO: Calcular preço dinamicamente
        calculatedPrice: calculatePixPrice(selectedPlan, [item], 0)
      })) || []
    });
  }, [cartItems, context]);

  // Função para forçar debug manual
  const debugCart = () => {
    console.log(`🔍 [${context}] MANUAL CART DEBUG:`, {
      timestamp: new Date().toISOString(),
      context,
      cartItems,
      allLocalStorage: Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>)
    });
  };

  return { debugCart };
};
