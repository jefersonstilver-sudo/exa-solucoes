
import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { loadCartFromStorage, saveCartToStorage } from '@/services/cartStorageService';
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
    const loadedLegacyCart = loadCartFromStorage();
    
    // Convert legacy cart items to full cart items
    const fullCartItems = loadedLegacyCart.map(convertLegacyToCartItem);
    
    setCartItems(fullCartItems);
    setInitialLoadDone(true);
    
    console.log("useCartState: Carrinho inicial carregado:", fullCartItems);
  }, [initialLoadDone]);

  // Save cart to localStorage whenever it changes using our improved service
  useEffect(() => {
    if (!initialLoadDone) {
      // Evita salvar antes do carregamento inicial
      return;
    }
    
    console.log("useCartState: Salvando carrinho no localStorage devido à mudança no estado:", cartItems);
    
    // Convert cart items to legacy format for storage
    const legacyCartItems = cartItems.map(item => ({
      panel: item.panel,
      duration: item.duration
    }));
    
    saveCartToStorage(legacyCartItems);
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
