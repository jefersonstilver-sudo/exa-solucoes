
import { useState, useEffect } from 'react';
import { isCartEmpty, loadCartFromStorage } from '@/services/cartStorageService';

export const useCart = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [unavailablePanels, setUnavailablePanels] = useState<string[]>([]);

  // Load cart from local storage on component mount
  useEffect(() => {
    try {
      const savedCart = loadCartFromStorage();
      setCartItems(savedCart || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    }
  }, []);

  return {
    cartItems,
    setCartItems,
    unavailablePanels,
    setUnavailablePanels,
    isEmpty: isCartEmpty()
  };
};
