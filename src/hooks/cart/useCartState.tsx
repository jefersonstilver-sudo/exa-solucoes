
import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';

export interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCartState = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('panelCart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  }, []);

  // Update localStorage when cart changes
  useEffect(() => {
    if (initialLoadDone) {
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
    }
  }, [cartItems, initialLoadDone]);

  // Clear cart function
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('panelCart');
  };

  return {
    cartItems,
    setCartItems,
    cartOpen,
    setCartOpen,
    loading,
    setLoading,
    initialLoadDone,
    clearCart,  // Added this to fix the missing property error
  };
};
