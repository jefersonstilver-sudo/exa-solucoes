
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

  // SIMPLIFICADO: Função direta para verificar se um building/panel está no carrinho
  const isItemInCart = (buildingId: string): boolean => {
    console.log('🔍 [useCartManager] isItemInCart chamado:', { buildingId, initialLoadDone, cartItemsLength: cartItems.length });
    
    if (!buildingId) {
      console.log('🔍 [useCartManager] buildingId vazio, retornando false');
      return false;
    }
    
    if (!initialLoadDone) {
      console.log('🔍 [useCartManager] initialLoadDone false, retornando false');
      return false;
    }
    
    const found = cartItems.some(item => {
      const match = item.panel.id === buildingId;
      console.log('🔍 [useCartManager] Verificando item:', { itemId: item.panel.id, buildingId, match });
      return match;
    });
    
    console.log('🔍 [useCartManager] Resultado final:', found);
    return found;
  };

  // SIMPLIFICADO: Função direta para obter item do carrinho por building ID
  const getCartItemByBuildingId = (buildingId: string): CartItem | null => {
    console.log('🔍 [useCartManager] getCartItemByBuildingId chamado:', { buildingId, initialLoadDone });
    
    if (!buildingId || !initialLoadDone) {
      console.log('🔍 [useCartManager] Condições não atendidas, retornando null');
      return null;
    }
    
    const item = cartItems.find(item => item.panel.id === buildingId) || null;
    console.log('🔍 [useCartManager] Item encontrado:', item ? item.panel.id : 'null');
    return item;
  };

  // Memoized functions to prevent unnecessary re-renders
  const reloadCartFromStorage = useCallback(() => {
    try {
      console.log('🔄 [useCartManager] Recarregando carrinho do storage');
      const loadedLegacyCart = loadCartFromStorage();
      const fullCartItems = loadedLegacyCart.map(convertLegacyToCartItem);
      setCartItems(fullCartItems);
      console.log('🔄 [useCartManager] Carrinho recarregado com sucesso:', fullCartItems.length);
      return fullCartItems;
    } catch (error) {
      console.error('[useCartManager] Error reloading cart:', error);
      return [];
    }
  }, [setCartItems]);

  console.log('🛒 [useCartManager] Hook renderizado:', {
    cartItemsLength: cartItems.length,
    initialLoadDone,
    cartOpen
  });

  return {
    // Cart state
    cartItems,
    cartOpen,
    cartAnimation,
    initialLoadDone, // CORREÇÃO: Exportando initialLoadDone
    
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
    
    // SIMPLIFICADO: Funções de verificação do carrinho (agora funções diretas)
    isItemInCart,
    getCartItemByBuildingId,
    
    // Debugging and testing - memoized
    reloadCartFromStorage
  };
};
