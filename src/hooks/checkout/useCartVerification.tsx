
import { useState, useEffect } from 'react';
import { loadCartFromStorage } from '@/services/cartStorageService';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

export const useCartVerification = (authVerified: boolean) => {
  const [hasCart, setHasCart] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  useEffect(() => {
    if (authVerified && !initialLoadDone) {
      try {
        const cartItems = loadCartFromStorage();
        const hasValidCart = cartItems && cartItems.length > 0;
        
        setHasCart(hasValidCart);
        setInitialLoadDone(true);
        
        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          LogLevel.INFO,
          `Cart verification: ${hasValidCart ? 'Cart found' : 'No cart found'}`,
          { cartItemsCount: cartItems?.length || 0 }
        );
      } catch (error) {
        console.error('[useCartVerification] Error loading cart:', error);
        setHasCart(false);
        setInitialLoadDone(true);
      }
    }
  }, [authVerified, initialLoadDone]);
  
  return {
    hasCart,
    initialLoadDone
  };
};
