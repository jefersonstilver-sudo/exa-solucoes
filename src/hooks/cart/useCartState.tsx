
import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { loadCartFromStorage, saveCartToStorage, cleanOrphanedCartItems } from '@/services/cartStorageService';

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
    
    console.log("useCartState: Limpando itens órfãos e carregando carrinho...");
    
    // Primeiro limpar itens órfãos
    cleanOrphanedCartItems();
    
    // Depois carregar carrinho limpo
    const loadedCart = loadCartFromStorage();
    setCartItems(loadedCart);
    setInitialLoadDone(true);
    
    console.log("useCartState: Carrinho inicial carregado:", loadedCart.length, "itens");
  }, [initialLoadDone]);

  // Save cart to localStorage whenever it changes using our improved service
  useEffect(() => {
    if (!initialLoadDone) {
      // Evita salvar antes do carregamento inicial
      return;
    }
    
    console.log("useCartState: Salvando carrinho no localStorage devido à mudança no estado:", cartItems.length, "itens");
    const success = saveCartToStorage(cartItems);
    
    if (!success) {
      console.error("useCartState: Falha ao salvar carrinho no localStorage");
    }
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
