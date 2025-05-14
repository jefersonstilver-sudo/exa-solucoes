import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';

export interface CartItem {
  panel: Panel;
  duration: number;
}

export const useCartState = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Load cart from localStorage on component mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('panelCart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
          console.log("Carrinho carregado do localStorage:", parsedCart.length, "itens");
        }
      } catch (e) {
        console.error('Falha ao carregar o carrinho do localStorage', e);
      }
    };
    
    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      console.log("Carrinho salvo no localStorage:", cartItems.length, "itens");
    } catch (e) {
      console.error('Falha ao salvar o carrinho no localStorage', e);
    }
  }, [cartItems]);

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
    setIsNavigating
  };
};
