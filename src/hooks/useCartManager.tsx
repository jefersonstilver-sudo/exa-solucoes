
import React, { useCallback, useMemo } from 'react';
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

  // Helper function to check if panel is in cart
  const isPanelInCart = useCallback((panelId: string): boolean => {
    const inCart = cartItems.some(item => item.panel.id === panelId);
    console.log('🔍 [useCartManager] isPanelInCart check:', {
      panelId,
      inCart,
      totalItems: cartItems.length,
      cartItemIds: cartItems.map(item => item.panel.id)
    });
    return inCart;
  }, [cartItems]);

  // Log cart state periodically for debugging
  React.useEffect(() => {
    if (initialLoadDone) {
      console.log('🔄 [useCartManager] === ESTADO ATUAL DO CARRINHO ===');
      console.log('🔄 [useCartManager] cartItemsLength:', cartItems.length);
      console.log('🔄 [useCartManager] cartOpen:', cartOpen);
      console.log('🔄 [useCartManager] cartAnimation:', cartAnimation);
      console.log('🔄 [useCartManager] items:', cartItems.map(item => ({
        id: item.id,
        panelId: item.panel.id,
        buildingName: item.panel.buildings?.nome,
        duration: item.duration,
        price: item.price
      })));
      console.log('🔄 [useCartManager] === FIM DO LOG ===');
    }
  }, [cartItems.length, cartOpen, initialLoadDone]);

  // Memoized function to prevent unnecessary re-renders
  const reloadCartFromStorage = useCallback(() => {
    try {
      console.log('🔄 [useCartManager] === RECARREGANDO CARRINHO ===');
      const loadedLegacyCart = loadCartFromStorage();
      const fullCartItems = loadedLegacyCart.map(convertLegacyToCartItem);
      setCartItems(fullCartItems);
      console.log('✅ [useCartManager] Carrinho recarregado:', fullCartItems.length, 'itens');
      return fullCartItems;
    } catch (error) {
      console.error('❌ [useCartManager] Erro ao recarregar carrinho:', error);
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
    
    // Helper functions
    isPanelInCart,
    
    // Debugging and testing
    reloadCartFromStorage
  };
};
