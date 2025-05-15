
import { useCartState } from '@/hooks/cart/useCartState';
import { useCartOperations } from '@/hooks/cart/useCartOperations';
import { useCartCheckout } from '@/hooks/cart/useCartCheckout';
import { Panel } from '@/types/panel';
import { CartItem as CartItemType } from './cart/useCartState';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { saveCartToStorage } from '@/services/cartStorageService';

export interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCartManager = () => {
  const {
    cartItems,
    setCartItems,
    cartOpen,
    setCartOpen,
    cartAnimation,
    setCartAnimation,
    isNavigating,
    setIsNavigating
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

  // Log para diagnóstico do estado atual do carrinho
  if (cartItems.length > 0) {
    // Verifica se o estado atual do carrinho é válido
    const cartValid = cartItems.every(item => 
      item && 
      item.panel && 
      typeof item.panel === 'object' && 
      item.panel.id && 
      typeof item.duration === 'number'
    );
    
    // Se não for válido, registra um erro crítico
    if (!cartValid) {
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART,
        LogLevel.ERROR,
        `ESTADO CRÍTICO: Carrinho com estrutura inválida detectado em useCartManager`,
        { 
          cartItems: JSON.stringify(cartItems),
          cartItemsCount: cartItems.length 
        }
      );
    } else {
      // Se for válido, registra o estado normal
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART,
        LogLevel.INFO,
        `Cart state in useCartManager: ${cartItems.length} items`,
        { 
          cartItemsCount: cartItems.length,
          itemSummary: cartItems.map(item => ({
            id: item.panel.id,
            name: item.panel.buildings?.nome || 'Unknown',
            duration: item.duration
          }))
        }
      );
      
      // Garantir que o carrinho está salvo no localStorage
      saveCartToStorage(cartItems);
    }
  }

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
    isNavigating
  };
};
