
import { Panel } from '@/types/panel';

// ÚNICA CHAVE DE STORAGE - NÃO DUPLICAR
export const CART_STORAGE_KEY = 'simple_cart';

export interface LegacyCartItem {
  panel: Panel;
  duration: number;
}

export const loadCartFromStorage = (): LegacyCartItem[] => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading cart from storage:', error);
  }
  return [];
};

export const saveCartToStorage = (cartItems: LegacyCartItem[]): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

export const clearCartStorage = (): void => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    // Limpar chaves antigas também
    localStorage.removeItem('indexa_cart');
    localStorage.removeItem('checkout_cart');
  } catch (error) {
    console.error('Error clearing cart storage:', error);
  }
};
