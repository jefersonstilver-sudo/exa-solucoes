
import { Panel } from '@/types/panel';
import { CartItem } from './useCartState';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { saveCartToStorage } from '@/services/cartStorageService';
import { Dispatch, SetStateAction } from 'react';

interface UseCartOperationsProps {
  cartItems: CartItem[];
  setCartItems: Dispatch<SetStateAction<CartItem[]>>;
  setCartAnimation: Dispatch<SetStateAction<boolean>>;
  setCartOpen: Dispatch<SetStateAction<boolean>>;
}

export const useCartOperations = ({
  cartItems,
  setCartItems,
  setCartAnimation,
  setCartOpen
}: UseCartOperationsProps) => {
  // Add to cart
  const handleAddToCart = (panel: Panel) => {
    // Check if panel is already in cart
    const existingItem = cartItems.find(item => item.panel.id === panel.id);
    
    if (existingItem) {
      logCheckoutEvent(
        CheckoutEvent.ADD_TO_CART,
        LogLevel.INFO,
        `Painel já existe no carrinho: ${panel.id}`,
        { panelId: panel.id }
      );
      return;
    }
    
    const newItem = {
      panel,
      duration: 30 // Default duration (1 month)
    };
    
    const updatedCart = [...cartItems, newItem];
    setCartItems(updatedCart);
    
    // Save to localStorage
    saveCartToStorage(updatedCart);
    
    // Show cart animation
    setCartAnimation(true);
    setTimeout(() => setCartAnimation(false), 500);
    
    // Open cart
    setCartOpen(true);
    
    logCheckoutEvent(
      CheckoutEvent.ADD_TO_CART,
      LogLevel.SUCCESS,
      `Painel adicionado ao carrinho: ${panel.id}`,
      { panelId: panel.id, cartCount: updatedCart.length }
    );
  };
  
  // Remove from cart
  const handleRemoveFromCart = (panelId: string) => {
    const updatedCart = cartItems.filter(item => item.panel.id !== panelId);
    setCartItems(updatedCart);
    
    // Save to localStorage
    saveCartToStorage(updatedCart);
    
    logCheckoutEvent(
      CheckoutEvent.REMOVE_FROM_CART,
      LogLevel.INFO,
      `Painel removido do carrinho: ${panelId}`,
      { panelId, cartCount: updatedCart.length }
    );
  };
  
  // Clear cart
  const handleClearCart = () => {
    setCartItems([]);
    
    // Clear localStorage
    localStorage.removeItem('panelCart');
    
    logCheckoutEvent(
      CheckoutEvent.CLEAR_CART,
      LogLevel.WARNING,
      `Carrinho limpo`,
      { previousCount: cartItems.length }
    );
  };
  
  // Change duration
  const handleChangeDuration = (panelId: string, duration: number) => {
    const updatedCart = cartItems.map(item => 
      item.panel.id === panelId 
        ? { ...item, duration } 
        : item
    );
    
    setCartItems(updatedCart);
    
    // Save to localStorage
    saveCartToStorage(updatedCart);
    
    logCheckoutEvent(
      CheckoutEvent.UPDATE_CART,
      LogLevel.INFO,
      `Duração atualizada para painel: ${panelId}`,
      { panelId, newDuration: duration }
    );
  };
  
  // Restore cart
  const handleRestoreCart = (items: CartItem[]) => {
    setCartItems(items);
    
    // Save to localStorage
    saveCartToStorage(items);
    
    logCheckoutEvent(
      CheckoutEvent.RESTORE_CART,
      LogLevel.SUCCESS,
      `Carrinho restaurado: ${items.length} itens`,
      { cartCount: items.length }
    );
  };
  
  // Toggle cart
  const toggleCart = () => {
    setCartOpen(prev => !prev);
  };
  
  return {
    handleAddToCart,
    handleRemoveFromCart,
    handleClearCart,
    handleChangeDuration,
    handleRestoreCart,
    toggleCart
  };
};
