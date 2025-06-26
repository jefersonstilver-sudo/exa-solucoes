
import { CartItem } from '@/types/cart';
import { loadCartFromStorage, saveCartToStorage, CART_STORAGE_KEY, LegacyCartItem } from '@/services/cartStorageService';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export interface CartValidationResult {
  isValid: boolean;
  error?: string;
  recoveredItems?: LegacyCartItem[];
}

export const validateCartForCheckout = (cartItems: CartItem[]): CartValidationResult => {
  // Log detailed cart state
  logCheckoutEvent(
    CheckoutEvent.CHECKOUT_INITIATION,
    LogLevel.INFO,
    `Validating cart for checkout - Total items: ${cartItems.length}`,
    { 
      itemCount: cartItems.length,
      currentPath: window.location.pathname,
      storageKey: CART_STORAGE_KEY,
      items: cartItems.map(item => ({
        panelId: item.panel.id,
        building: item.panel.buildings?.nome || 'Desconhecido',
        duration: item.duration
      }))
    }
  );

  // Check localStorage directly
  const localStorageCart = localStorage.getItem(CART_STORAGE_KEY);
  console.log("Direct localStorage check before checkout:", localStorageCart);
  
  if (!localStorageCart || localStorageCart === '[]') {
    console.error("CRITICAL ERROR: localStorage empty before checkout");
    logCheckoutEvent(
      CheckoutEvent.EMPTY_CART_ATTEMPT,
      LogLevel.ERROR,
      `CRITICAL ERROR: localStorage empty [${CART_STORAGE_KEY}] before checkout`,
      { 
        timestamp: Date.now(),
        storageKey: CART_STORAGE_KEY,
        localStorageValue: localStorageCart
      }
    );
    
    // Emergency recovery attempt
    try {
      const reloadedCart = loadCartFromStorage();
      if (reloadedCart && reloadedCart.length > 0) {
        console.log("Emergency recovery: cart recovered from localStorage", reloadedCart);
        return { isValid: true, recoveredItems: reloadedCart };
      } else {
        return { isValid: false, error: "Carrinho vazio" };
      }
    } catch (e) {
      console.error("Emergency recovery failed", e);
      return { isValid: false, error: "Carrinho vazio" };
    }
  }
  
  // Check cart state
  if (!cartItems || cartItems.length === 0) {
    logCheckoutEvent(
      CheckoutEvent.EMPTY_CART_ATTEMPT,
      LogLevel.ERROR,
      `CRITICAL ERROR: Checkout attempt with empty cart (state) [${CART_STORAGE_KEY}]`,
      { 
        timestamp: Date.now(),
        storageKey: CART_STORAGE_KEY,
        cartState: JSON.stringify(cartItems),
        localStorageState: localStorage.getItem(CART_STORAGE_KEY)
      }
    );
    
    return { isValid: false, error: "Carrinho vazio" };
  }

  return { isValid: true };
};

export const saveCartForCheckout = (cartItems: CartItem[]): boolean => {
  // Convert CartItem[] to legacy format
  const legacyCartItems: LegacyCartItem[] = cartItems.map(item => ({
    panel: item.panel,
    duration: item.duration
  }));
  
  console.log("Saving final cart before checkout:", legacyCartItems);
  
  try {
    saveCartToStorage(legacyCartItems);
    
    // Extra verification after saving
    const verificationCart = localStorage.getItem(CART_STORAGE_KEY);
    console.log("Verification after save before checkout:", verificationCart);
    
    if (!verificationCart || verificationCart === '[]') {
      throw new Error("Critical failure: cart still empty after save attempt");
    }
    
    return true;
  } catch (error) {
    console.error("Failed to save cart:", error);
    return false;
  }
};
