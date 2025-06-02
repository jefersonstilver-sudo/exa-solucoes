
import React, { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { loadCartFromStorage, saveCartToStorage } from '@/services/cartStorageService';
import { getPanelPrice } from '@/utils/checkoutUtils';

// Função pura para conversão
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
  
  // Clean up localStorage on mount to remove conflicting keys
  useEffect(() => {
    // Remove conflicting modern cart keys
    localStorage.removeItem('indexa_modern_cart');
    localStorage.removeItem('indexa_cart_version');
    console.log('🧹 [useCartState] Removed conflicting cart storage keys');
  }, []);

  // Carregamento inicial
  useEffect(() => {
    if (initialLoadDone) return;
    
    console.log('🔄 [useCartState] Carregando carrinho inicial...');
    const loadedLegacyCart = loadCartFromStorage();
    const fullCartItems = loadedLegacyCart.map(convertLegacyToCartItem);
    
    console.log('📦 [useCartState] Carrinho carregado:', {
      legacyItems: loadedLegacyCart.length,
      fullItems: fullCartItems.length,
      items: fullCartItems.map(item => ({ id: item.id, panelId: item.panel.id, name: item.panel.buildings?.nome }))
    });
    
    setCartItems(fullCartItems);
    setInitialLoadDone(true);
  }, [initialLoadDone]);

  // Salvamento automático com logging detalhado
  useEffect(() => {
    if (!initialLoadDone) return;
    
    console.log('💾 [useCartState] Salvando carrinho automaticamente...', {
      itemCount: cartItems.length,
      items: cartItems.map(item => ({ id: item.id, panelId: item.panel.id, name: item.panel.buildings?.nome }))
    });
    
    const legacyCartItems = cartItems.map(item => ({
      panel: item.panel,
      duration: item.duration
    }));
    
    const saveSuccess = saveCartToStorage(legacyCartItems);
    console.log('💾 [useCartState] Salvamento resultado:', saveSuccess ? 'SUCESSO' : 'FALHOU');
    
    // Verify save by reading back
    setTimeout(() => {
      const verification = loadCartFromStorage();
      console.log('🔍 [useCartState] Verificação pós-salvamento:', {
        saved: legacyCartItems.length,
        verified: verification.length,
        match: verification.length === legacyCartItems.length
      });
    }, 100);
    
  }, [cartItems, initialLoadDone]);

  // Manage body class for drawer state
  useEffect(() => {
    if (cartOpen) {
      document.body.classList.add('drawer-open');
      console.log('🎨 [useCartState] Cart aberto - classe drawer-open adicionada');
    } else {
      document.body.classList.remove('drawer-open');
      console.log('🎨 [useCartState] Cart fechado - classe drawer-open removida');
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
