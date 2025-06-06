
import { useState, useEffect, useCallback } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getPanelPrice } from '@/utils/checkoutUtils';

const CART_KEY = 'simple_cart';

export const useSimpleCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load cart on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cart when items change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    }
  }, [cartItems, isLoading]);

  const isItemInCart = useCallback((panelId: string): boolean => {
    return cartItems.some(item => item.panel?.id === panelId);
  }, [cartItems]);

  const addToCart = useCallback((panel: Panel, duration: number = 30) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.panel?.id === panel.id);
      
      if (existingIndex >= 0) {
        return prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, duration, price: getPanelPrice(panel, duration), addedAt: Date.now() }
            : item
        );
      } else {
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

    setIsOpen(true);
    toast.success(`${panel.buildings?.nome || 'Painel'} adicionado ao carrinho!`);
  }, []);

  const removeFromCart = useCallback((panelId: string) => {
    const item = cartItems.find(item => item.panel?.id === panelId);
    setCartItems(prev => prev.filter(item => item.panel?.id !== panelId));
    toast.success(`${item?.panel.buildings?.nome || 'Painel'} removido do carrinho`);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem(CART_KEY);
    toast.success('Carrinho limpo');
  }, []);

  const updateDuration = useCallback((panelId: string, duration: number) => {
    setCartItems(prev => prev.map(item => 
      item.panel?.id === panelId 
        ? { ...item, duration, price: getPanelPrice(item.panel, duration) }
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
