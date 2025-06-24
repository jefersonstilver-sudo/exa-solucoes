
import { useState, useEffect, useCallback } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { loadCartFromStorage, saveCartToStorage, clearCartStorage, LegacyCartItem } from '@/services/cartStorageService';

const convertLegacyToCartItem = (legacyItem: LegacyCartItem): CartItem => {
  const basePrice = legacyItem.panel.buildings?.preco_base || 200;
  
  return {
    id: `cart_${legacyItem.panel.id}_${Date.now()}`,
    panel: legacyItem.panel,
    duration: legacyItem.duration,
    addedAt: Date.now(),
    price: basePrice
  };
};

const convertCartItemToLegacy = (cartItem: CartItem): LegacyCartItem => ({
  panel: cartItem.panel,
  duration: cartItem.duration
});

export const useSimpleCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  // Load cart on mount
  useEffect(() => {
    try {
      const legacyItems = loadCartFromStorage();
      const convertedItems = legacyItems.map(convertLegacyToCartItem);
      setCartItems(convertedItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cart when items change
  useEffect(() => {
    if (!isLoading && cartItems.length >= 0) {
      try {
        const legacyItems = cartItems.map(convertCartItemToLegacy);
        saveCartToStorage(legacyItems);
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    }
  }, [cartItems, isLoading]);

  const isItemInCart = useCallback((panelId: string): boolean => {
    return cartItems.some(item => item.panel?.id === panelId);
  }, [cartItems]);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
  }, []);

  const addToCart = useCallback((panel: Panel, duration: number = 30) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.panel?.id === panel.id);
      
      if (existingIndex >= 0) {
        // Update existing item
        const updated = prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, duration, addedAt: Date.now() }
            : item
        );
        return updated;
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `cart_${panel.id}_${Date.now()}`,
          panel,
          duration,
          addedAt: Date.now(),
          price: panel.buildings?.preco_base || 200
        };
        return [...prev, newItem];
      }
    });

    triggerAnimation();
    
    toast.success(`${panel.buildings?.nome || 'Painel'} adicionado ao carrinho!`, {
      duration: 2000,
      position: 'top-center'
    });
  }, [triggerAnimation]);

  const removeFromCart = useCallback((panelId: string) => {
    const item = cartItems.find(item => item.panel?.id === panelId);
    setCartItems(prev => prev.filter(item => item.panel?.id !== panelId));
    toast.success(`${item?.panel.buildings?.nome || 'Painel'} removido do carrinho`);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    clearCartStorage();
    toast.success('Carrinho limpo');
  }, []);

  const updateDuration = useCallback((panelId: string, duration: number) => {
    setCartItems(prev => prev.map(item => 
      item.panel?.id === panelId 
        ? { ...item, duration }
        : item
    ));
  }, []);

  const proceedToCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    setIsOpen(false);
    navigate('/plano');
  }, [cartItems.length, navigate]);

  return {
    cartItems,
    isOpen,
    setIsOpen,
    isLoading,
    isAnimating,
    itemCount: cartItems.length,
    totalPrice: cartItems.reduce((sum, item) => sum + item.price, 0),
    isItemInCart,
    addToCart,
    removeFromCart,
    clearCart,
    updateDuration,
    proceedToCheckout,
    toggleCart: () => setIsOpen(prev => !prev)
  };
};
