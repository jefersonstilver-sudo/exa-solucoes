
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
    localStorage.removeItem('modernCart');
    localStorage.removeItem('cart_items');
    console.log('🧹 [useCartState] Removed ALL conflicting cart storage keys');
  }, []);

  // Carregamento inicial com verificação de integridade
  useEffect(() => {
    if (initialLoadDone) return;
    
    console.log('🔄 [useCartState] === CARREGAMENTO INICIAL DO CARRINHO ===');
    
    try {
      const loadedLegacyCart = loadCartFromStorage();
      const fullCartItems = loadedLegacyCart.map(convertLegacyToCartItem);
      
      console.log('📦 [useCartState] Carrinho carregado do storage:', {
        legacyItems: loadedLegacyCart.length,
        fullItems: fullCartItems.length,
        items: fullCartItems.map(item => ({ 
          id: item.id, 
          panelId: item.panel.id, 
          name: item.panel.buildings?.nome,
          price: item.price
        }))
      });
      
      setCartItems(fullCartItems);
      setInitialLoadDone(true);
      
      // Force a state verification after loading
      setTimeout(() => {
        console.log('🔍 [useCartState] Verificação pós-carregamento:', {
          reactState: fullCartItems.length,
          storage: loadCartFromStorage().length
        });
      }, 500);
      
    } catch (error) {
      console.error('❌ [useCartState] Erro no carregamento inicial:', error);
      setCartItems([]);
      setInitialLoadDone(true);
    }
  }, [initialLoadDone]);

  // Salvamento automático com verificação robusta
  useEffect(() => {
    if (!initialLoadDone) return;
    
    console.log('💾 [useCartState] === SALVAMENTO AUTOMÁTICO ===');
    console.log('💾 [useCartState] Itens no estado React:', {
      count: cartItems.length,
      items: cartItems.map(item => ({ 
        id: item.id, 
        panelId: item.panel.id, 
        name: item.panel.buildings?.nome 
      }))
    });
    
    try {
      const legacyCartItems = cartItems.map(item => ({
        panel: item.panel,
        duration: item.duration
      }));
      
      const saveSuccess = saveCartToStorage(legacyCartItems);
      console.log('💾 [useCartState] Resultado do salvamento:', saveSuccess ? 'SUCESSO' : 'FALHOU');
      
      // Immediate verification
      const verification = loadCartFromStorage();
      console.log('🔍 [useCartState] Verificação imediata:', {
        saved: legacyCartItems.length,
        verified: verification.length,
        match: verification.length === legacyCartItems.length,
        storageItems: verification.map(item => item.panel.id)
      });
      
      if (verification.length !== legacyCartItems.length) {
        console.error('⚠️ [useCartState] MISMATCH detectado entre React state e localStorage!');
      }
      
    } catch (error) {
      console.error('❌ [useCartState] Erro no salvamento:', error);
    }
  }, [cartItems, initialLoadDone]);

  // Debug: Log state changes
  useEffect(() => {
    if (initialLoadDone) {
      console.log('🔄 [useCartState] === MUDANÇA DE ESTADO ===');
      console.log('🔄 [useCartState] cartItems.length:', cartItems.length);
      console.log('🔄 [useCartState] cartOpen:', cartOpen);
      console.log('🔄 [useCartState] cartAnimation:', cartAnimation);
    }
  }, [cartItems.length, cartOpen, cartAnimation, initialLoadDone]);

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
