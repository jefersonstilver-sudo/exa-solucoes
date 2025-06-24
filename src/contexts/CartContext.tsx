
import React, { createContext, useContext, ReactNode } from 'react';
import { useCartState } from '@/hooks/cart/useCartState';
import { useCartOperations } from '@/hooks/cart/useCartOperations';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { calculatePixPrice } from '@/utils/priceCalculator';
import { PlanKey } from '@/types/checkout';

interface CartContextType {
  cartItems: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  cartAnimation: boolean;
  isNavigating: boolean;
  setIsNavigating: (navigating: boolean) => void;
  itemCount: number;
  totalPrice: number;
  handleAddToCart: (panel: Panel, duration?: number) => void;
  handleRemoveFromCart: (panelId: string) => void;
  handleClearCart: () => void;
  handleChangeDuration: (panelId: string, duration: number) => void;
  toggleCart: () => void;
  initialLoadDone: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    cartItems,
    setCartItems,
    cartOpen,
    setCartOpen,
    cartAnimation,
    setCartAnimation,
    isNavigating,
    setIsNavigating,
    initialLoadDone
  } = useCartState();

  const {
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    toggleCart
  } = useCartOperations({
    cartItems,
    setCartItems,
    setCartAnimation,
    setCartOpen
  });

  // CORRIGIDO: Fazer type casting para PlanKey
  const getTotalPrice = () => {
    const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1') as PlanKey;
    return calculatePixPrice(selectedPlan, cartItems, 0);
  };

  const contextValue: CartContextType = {
    cartItems,
    cartOpen,
    setCartOpen,
    cartAnimation,
    isNavigating,
    setIsNavigating,
    itemCount: cartItems.length,
    totalPrice: getTotalPrice(),
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    toggleCart,
    initialLoadDone
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
