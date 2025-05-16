import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { loadCartFromStorage, saveCartToStorage } from '@/services/cartStorageService';

export interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCartState = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Load cart from localStorage on component mount - garantindo apenas uma vez
  useEffect(() => {
    if (initialLoadDone) return;
    
    console.log("useCartState: Carregando carrinho do localStorage (load inicial)");
    const loadedCart = loadCartFromStorage();
    setCartItems(loadedCart);
    setInitialLoadDone(true);
    
    console.log("useCartState: Carrinho inicial carregado:", loadedCart);
  }, [initialLoadDone]);

  // Save cart to localStorage whenever it changes using our improved service
  useEffect(() => {
    if (!initialLoadDone) {
      // Evita salvar antes do carregamento inicial
      return;
    }
    
    console.log("useCartState: Salvando carrinho no localStorage devido à mudança no estado:", cartItems);
    saveCartToStorage(cartItems);
  }, [cartItems, initialLoadDone]);

  // Keep cart open when items are added
  useEffect(() => {
    if (cartItems.length > 0 && !isNavigating) {
      setCartOpen(true);
      document.body.classList.add('drawer-open');
    } else if (cartItems.length === 0) {
      document.body.classList.remove('drawer-open');
    }

    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [cartItems.length, isNavigating]);

  return {
    cartItems,
    setCartItems,
    cartOpen,
    setCartOpen,
    cartAnimation,
    setCartAnimation,
    isNavigating,
    setIsNavigating,
    initialLoadDone
  };
};
