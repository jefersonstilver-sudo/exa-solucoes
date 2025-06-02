
import { Panel } from '@/types/panel';

export const CART_STORAGE_KEY = 'panelCart';

export interface LegacyCartItem {
  panel: Panel;
  duration: number;
}

export const saveCartToStorage = (cartItems: LegacyCartItem[]): void => {
  try {
    const cartData = JSON.stringify(cartItems);
    localStorage.setItem(CART_STORAGE_KEY, cartData);
    console.log('✅ [CartStorage] Cart saved successfully:', {
      key: CART_STORAGE_KEY,
      itemCount: cartItems.length,
      dataSize: cartData.length
    });
  } catch (error) {
    console.error('❌ [CartStorage] Error saving cart to localStorage:', error);
  }
};

export const loadCartFromStorage = (): LegacyCartItem[] => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) {
      console.log('📭 [CartStorage] No cart found in localStorage with key:', CART_STORAGE_KEY);
      return [];
    }
    
    const parsed = JSON.parse(saved);
    console.log('✅ [CartStorage] Cart loaded successfully:', {
      key: CART_STORAGE_KEY,
      itemCount: parsed.length,
      items: parsed.map((item: LegacyCartItem) => ({
        panelId: item.panel.id,
        name: item.panel.buildings?.nome,
        duration: item.duration
      }))
    });
    return parsed;
  } catch (error) {
    console.error('❌ [CartStorage] Error loading cart from localStorage:', error);
    return [];
  }
};

export const clearCartFromStorage = (): void => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    console.log('🗑️ [CartStorage] Cart cleared from localStorage with key:', CART_STORAGE_KEY);
  } catch (error) {
    console.error('❌ [CartStorage] Error clearing cart from localStorage:', error);
  }
};
