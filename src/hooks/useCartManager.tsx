
import React, { useCallback } from 'react';
import { useCartState } from '@/hooks/cart/useCartState';
import { useCartOperations } from '@/hooks/cart/useCartOperations';
import { useCartCheckout } from '@/hooks/cart/useCartCheckout';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { 
  saveCartToStorage, 
  loadCartFromStorage, 
  CART_STORAGE_KEY 
} from '@/services/cartStorageService';
import { getPanelPrice } from '@/utils/checkoutUtils';

// Utility function to convert legacy cart item to full cart item
const convertLegacyToCartItem = (legacyItem: { panel: Panel; duration: number }): CartItem => {
  return {
    id: `cart_${legacyItem.panel.id}_${Date.now()}`,
    panel: legacyItem.panel,
    duration: legacyItem.duration,
    addedAt: Date.now(),
    price: getPanelPrice(legacyItem.panel, legacyItem.duration)
  };
};

export const useCartManager = () => {
  const {
    cartItems,
    setCartItems,
    cartOpen,
    setCartOpen,
    cartAnimation,
    setCartAnimation,
    isNavigating,
    setIsNavigating,
    initialLoadDone
  } = useCartState();
  
  const {
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleRestoreCart,
    toggleCart
  } = useCartOperations({
    cartItems,
    setCartItems,
    setCartAnimation,
    setCartOpen
  });
  
  const {
    handleProceedToCheckout
  } = useCartCheckout({
    cartItems,
    setIsNavigating,
    setCartOpen
  });

  // Memoized functions to prevent unnecessary re-renders
  const reloadCartFromStorage = useCallback(() => {
    try {
      const loadedLegacyCart = loadCartFromStorage();
      const fullCartItems = loadedLegacyCart.map(convertLegacyToCartItem);
      setCartItems(fullCartItems);
      return fullCartItems;
    } catch (error) {
      console.error('[useCartManager] Error reloading cart:', error);
      return [];
    }
  }, [setCartItems]);

  return {
    // Cart state
    cartItems,
    cartOpen,
    cartAnimation,
    
    // Cart state mutators
    setCartOpen,
    
    // Cart operations
    toggleCart,
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleRestoreCart,
    
    // Checkout
    handleProceedToCheckout,
    isNavigating,
    
    // Debugging and testing - memoized
    reloadCartFromStorage
  };
};
