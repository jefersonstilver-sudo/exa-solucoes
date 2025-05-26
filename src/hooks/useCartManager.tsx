
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

  // Log para diagnóstico do estado atual do carrinho
  if (initialLoadDone && cartItems.length > 0) {
    // Verifica se o estado atual do carrinho é válido
    const cartValid = cartItems.every(item => 
      item && 
      item.panel && 
      typeof item.panel === 'object' && 
      item.panel.id && 
      typeof item.duration === 'number'
    );
    
    // Verificação de consistência entre estado e localStorage
    const localStorageCart = localStorage.getItem(CART_STORAGE_KEY);
    const localStorageParsed = localStorageCart ? JSON.parse(localStorageCart) : [];
    const storageCount = Array.isArray(localStorageParsed) ? localStorageParsed.length : 0;
    
    console.log("useCartManager: Verificação de integridade:", {
      cartItemsCount: cartItems.length,
      localStorageCount: storageCount,
      match: cartItems.length === storageCount
    });
    
    // Se não for válido, registra um erro crítico
    if (!cartValid) {
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART,
        LogLevel.ERROR,
        `ESTADO CRÍTICO: Carrinho com estrutura inválida detectado em useCartManager [${CART_STORAGE_KEY}]`,
        { 
          cartItems: JSON.stringify(cartItems),
          cartItemsCount: cartItems.length,
          storageKey: CART_STORAGE_KEY
        }
      );
    } else if (cartItems.length !== storageCount) {
      // Se houver discrepância entre estado e localStorage
      console.error("DISCREPÂNCIA: Estado do carrinho e localStorage não coincidem", {
        stateCount: cartItems.length,
        storageCount
      });
      
      // Forçar sincronização para resolver a discrepância
      saveCartToStorage(cartItems);
      
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART,
        LogLevel.WARNING,
        `DISCREPÂNCIA: Estado do carrinho e localStorage não coincidem [${CART_STORAGE_KEY}]. Sincronizando...`,
        { 
          stateCount: cartItems.length,
          storageCount,
          action: "forced_sync"
        }
      );
    } else {
      // Se for válido, registra o estado normal
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        `Estado do carrinho em useCartManager [${CART_STORAGE_KEY}]: ${cartItems.length} itens`,
        { 
          cartItemsCount: cartItems.length,
          storageKey: CART_STORAGE_KEY,
          itemSummary: cartItems.map(item => ({
            id: item.panel.id,
            name: item.panel.buildings?.nome || 'Unknown',
            duration: item.duration
          }))
        }
      );
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
    isNavigating,
    
    // Debugging and testing
    reloadCartFromStorage: () => {
      const loadedCart = loadCartFromStorage();
      setCartItems(loadedCart);
      return loadedCart;
    }
  };
};
