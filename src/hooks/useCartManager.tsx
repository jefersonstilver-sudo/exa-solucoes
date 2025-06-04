
import React, { useState, useEffect, useCallback } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getPanelPrice } from '@/utils/checkoutUtils';
import { 
  saveCartToStorage, 
  loadCartFromStorage, 
  CART_STORAGE_KEY 
} from '@/services/cartStorageService';

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

export const useCartManager = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const navigate = useNavigate();

  // Load cart on mount
  useEffect(() => {
    console.log('🛒 [useCartManager] Carregando carrinho inicial...');
    try {
      const loadedLegacyCart = loadCartFromStorage();
      const fullCartItems = loadedLegacyCart.map(convertLegacyToCartItem);
      setCartItems(fullCartItems);
      setInitialLoadDone(true);
      console.log('🛒 [useCartManager] Carrinho carregado:', fullCartItems.length, 'itens');
    } catch (error) {
      console.error('🛒 [useCartManager] Erro ao carregar carrinho:', error);
      setInitialLoadDone(true);
    }
  }, []);

  // Save cart when items change
  useEffect(() => {
    if (!initialLoadDone) return;
    
    console.log('🛒 [useCartManager] Salvando carrinho:', cartItems.length, 'itens');
    const legacyCartItems = cartItems.map(item => ({
      panel: item.panel,
      duration: item.duration
    }));
    saveCartToStorage(legacyCartItems);
  }, [cartItems, initialLoadDone]);

  // Simple check if item is in cart
  const isItemInCart = useCallback((buildingId: string): boolean => {
    if (!buildingId || !initialLoadDone) return false;
    const inCart = cartItems.some(item => item.panel.id === buildingId);
    console.log('🛒 [useCartManager] Verificando se item está no carrinho:', buildingId, '→', inCart);
    return inCart;
  }, [cartItems, initialLoadDone]);

  // Get cart item by building ID
  const getCartItemByBuildingId = useCallback((buildingId: string): CartItem | null => {
    if (!buildingId || !initialLoadDone) return null;
    return cartItems.find(item => item.panel.id === buildingId) || null;
  }, [cartItems, initialLoadDone]);

  // Add to cart function
  const handleAddToCart = useCallback((panel: Panel, duration: number = 30) => {
    console.log('🛒 [useCartManager] Adicionando ao carrinho:', panel.id, 'duração:', duration);
    
    setCartItems(prev => {
      // Check if panel is already in cart
      const existingIndex = prev.findIndex(item => item.panel.id === panel.id);
      
      if (existingIndex >= 0) {
        console.log('🛒 [useCartManager] Atualizando item existente');
        // Update existing item
        return prev.map((item, index) => 
          index === existingIndex 
            ? {
                ...item,
                duration,
                price: getPanelPrice(panel, duration),
                addedAt: Date.now()
              }
            : item
        );
      } else {
        console.log('🛒 [useCartManager] Adicionando novo item');
        // Add new item
        const newItem: CartItem = {
          id: `cart_${panel.id}_${Date.now()}`,
          panel,
          duration,
          addedAt: Date.now(),
          price: getPanelPrice(panel, duration)
        };
        return [...prev, newItem];
      }
    });
    
    // Animation and open cart
    setCartAnimation(true);
    setCartOpen(true);
    
    // Reset animation
    setTimeout(() => setCartAnimation(false), 800);
    
    // Show success toast
    toast.success(`${panel.buildings?.nome || 'Painel'} adicionado ao carrinho!`, {
      description: "Painel adicionado com sucesso",
      duration: 3000,
    });
  }, []);

  // Remove from cart
  const handleRemoveFromCart = useCallback((panelId: string) => {
    console.log('🛒 [useCartManager] Removendo do carrinho:', panelId);
    
    const panelToRemove = cartItems.find(item => item.panel.id === panelId);
    const panelName = panelToRemove?.panel.buildings?.nome || 'Painel';
    
    setCartItems(prev => prev.filter(item => item.panel.id !== panelId));
    
    toast.success(`${panelName} removido do carrinho`, {
      duration: 3000,
    });
  }, [cartItems]);

  // Clear cart
  const handleClearCart = useCallback(() => {
    console.log('🛒 [useCartManager] Limpando carrinho');
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    
    toast.success('Carrinho limpo', {
      description: "Todos os itens foram removidos",
      duration: 3000,
    });
  }, []);

  // Change duration
  const handleChangeDuration = useCallback((panelId: string, duration: number) => {
    console.log('🛒 [useCartManager] Alterando duração:', panelId, '→', duration);
    
    setCartItems(prev => prev.map(item => 
      item.panel.id === panelId 
        ? {
            ...item,
            duration,
            price: getPanelPrice(item.panel, duration)
          }
        : item
    ));
  }, []);

  // Toggle cart
  const toggleCart = useCallback(() => {
    console.log('🛒 [useCartManager] Alternando estado do carrinho');
    setCartOpen(prev => !prev);
  }, []);

  // Proceed to checkout
  const handleProceedToCheckout = useCallback(() => {
    console.log('🛒 [useCartManager] Prosseguindo para checkout');
    if (cartItems.length === 0) {
      toast.error('Carrinho vazio', {
        description: 'Adicione itens ao carrinho antes de prosseguir',
      });
      return;
    }
    
    setIsNavigating(true);
    setCartOpen(false);
    navigate('/plano');
  }, [cartItems.length, navigate]);

  // Restore cart function (for backup)
  const handleRestoreCart = useCallback(() => {
    try {
      const lastCart = sessionStorage.getItem('lastCart');
      if (lastCart) {
        const parsedCart = JSON.parse(lastCart);
        setCartItems(parsedCart);
        sessionStorage.removeItem('lastCart');
        toast.success('Carrinho restaurado');
        return true;
      }
    } catch (e) {
      console.error('Erro ao restaurar carrinho:', e);
    }
    return false;
  }, []);

  return {
    // Cart state
    cartItems,
    cartOpen,
    cartAnimation,
    initialLoadDone,
    isNavigating,
    
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
    
    // Cart verification functions
    isItemInCart,
    getCartItemByBuildingId
  };
};
