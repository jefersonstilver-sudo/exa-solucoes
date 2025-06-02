
import React, { useCallback } from 'react';
import { useCartState } from '@/hooks/cart/useCartState';
import { useCartOperations } from '@/hooks/cart/useCartOperations';
import { useCartCheckout } from '@/hooks/cart/useCartCheckout';

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
    }
  }, [cartItems.length, cartOpen, initialLoadDone]);

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
    
    // Checkout
    handleProceedToCheckout,
    isNavigating,
    
    // Status
    initialLoadDone
  };
};
