
import { Panel } from '@/types/panel';

export const CART_STORAGE_KEY = 'panelCart';

export interface LegacyCartItem {
  panel: Panel;
  duration: number;
}

export const saveCartToStorage = (cartItems: LegacyCartItem[]): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    console.log('✅ [CartStorage] Cart saved to localStorage:', cartItems.length, 'items');
  } catch (error) {
    console.error('❌ [CartStorage] Error saving cart to localStorage:', error);
  }
};

export const loadCartFromStorage = (): LegacyCartItem[] => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) {
      console.log('📭 [CartStorage] No cart found in localStorage');
      return [];
    }
    
    const parsed = JSON.parse(saved);
    console.log('✅ [CartStorage] Cart loaded from localStorage:', parsed.length, 'items');
    return parsed;
  } catch (error) {
    console.error('❌ [CartStorage] Error loading cart from localStorage:', error);
    return [];
  }
};

export const clearCartFromStorage = (): void => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    console.log('🗑️ [CartStorage] Cart cleared from localStorage');
  } catch (error) {
    console.error('❌ [CartStorage] Error clearing cart from localStorage:', error);
  }
};
