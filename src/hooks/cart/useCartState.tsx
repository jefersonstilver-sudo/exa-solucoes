
import React, { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { loadCartFromStorage, saveCartToStorage } from '@/services/cartStorageService';

// Função pura para conversão
const convertLegacyToCartItem = (legacyItem: { panel: Panel; duration: number }): CartItem => {
  return {
    id: `cart_${legacyItem.panel.id}_${Date.now()}`,
    panel: legacyItem.panel,
    duration: legacyItem.duration,
    addedAt: Date.now()
    // REMOVIDO: price - será calculado dinamicamente quando necessário
  };
};

export const useCartState = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // Carregamento inicial - simplificado
  useEffect(() => {
    if (initialLoadDone) return;
    
    console.log("useCartState: Carregando carrinho inicial");
    const loadedLegacyCart = loadCartFromStorage();
    const fullCartItems = loadedLegacyCart.map(convertLegacyToCartItem);
    
    setCartItems(fullCartItems);
    setInitialLoadDone(true);
    
    console.log("useCartState: Carrinho carregado:", fullCartItems);
  }, [initialLoadDone]);

  // Salvamento automático - OTIMIZADO
  useEffect(() => {
    if (!initialLoadDone) return;
    
    console.log("useCartState: Salvando carrinho:", cartItems.length, "itens");
    
    const legacyCartItems = cartItems.map(item => ({
      panel: item.panel,
      duration: item.duration
    }));
    
    saveCartToStorage(legacyCartItems);
  }, [cartItems, initialLoadDone]);

  // Body class management para drawer
  useEffect(() => {
    if (cartOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }

    return () => {
      document.body.classList.remove('drawer-open');
    };
  }, [cartOpen]);

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
