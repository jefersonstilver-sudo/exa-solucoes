
import { useState, useEffect, useCallback } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getPanelPrice } from '@/utils/checkoutUtils';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

const CART_KEY = 'indexa_unified_cart';

// Simplified cart item creation
const createCartItem = (panel: Panel, duration: number = 30): CartItem => ({
  id: `cart_${panel.id}_${Date.now()}`,
  panel,
  duration,
  addedAt: Date.now(),
  price: getPanelPrice(panel, duration)
});

export const useUnifiedCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
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
          console.log('🛒 [UnifiedCart] Carrinho carregado:', parsed.length, 'itens');
        }
      }
    } catch (error) {
      console.error('🛒 [UnifiedCart] Erro ao carregar:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save cart when items change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
        console.log('🛒 [UnifiedCart] Carrinho salvo:', cartItems.length, 'itens');
      } catch (error) {
        console.error('🛒 [UnifiedCart] Erro ao salvar:', error);
      }
    }
  }, [cartItems, isLoading]);

  // Check if item is in cart
  const isItemInCart = useCallback((panelId: string): boolean => {
    const inCart = cartItems.some(item => item.panel.id === panelId);
    console.log('🛒 [UnifiedCart] isItemInCart:', panelId, '→', inCart);
    return inCart;
  }, [cartItems]);

  // Add item to cart
  const addToCart = useCallback((panel: Panel, duration: number = 30) => {
    console.log('🛒 [UnifiedCart] Adicionando item:', panel.id);
    
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.panel.id === panel.id);
      
      if (existingIndex >= 0) {
        // Update existing item
        console.log('🛒 [UnifiedCart] Atualizando item existente');
        return prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, duration, price: getPanelPrice(panel, duration), addedAt: Date.now() }
            : item
        );
      } else {
        // Add new item
        console.log('🛒 [UnifiedCart] Adicionando novo item');
        const newItem = createCartItem(panel, duration);
        return [...prev, newItem];
      }
    });

    // Trigger animation and open cart
    setIsAnimating(true);
    setIsOpen(true);
    setTimeout(() => setIsAnimating(false), 800);

    // Log event
    logCheckoutEvent(
      CheckoutEvent.ADD_TO_CART,
      LogLevel.INFO,
      "Item adicionado ao carrinho unificado",
      { panelId: panel.id, duration }
    );

    // Show success toast
    toast.success(`${panel.buildings?.nome || 'Painel'} adicionado ao carrinho!`);
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((panelId: string) => {
    console.log('🛒 [UnifiedCart] Removendo item:', panelId);
    
    const itemToRemove = cartItems.find(item => item.panel.id === panelId);
    setCartItems(prev => prev.filter(item => item.panel.id !== panelId));
    
    toast.success(`${itemToRemove?.panel.buildings?.nome || 'Painel'} removido do carrinho`);
  }, [cartItems]);

  // Clear cart
  const clearCart = useCallback(() => {
    console.log('🛒 [UnifiedCart] Limpando carrinho');
    setCartItems([]);
    toast.success('Carrinho limpo');
  }, []);

  // Update duration
  const updateDuration = useCallback((panelId: string, duration: number) => {
    console.log('🛒 [UnifiedCart] Atualizando duração:', panelId, duration);
    
    setCartItems(prev => prev.map(item => 
      item.panel.id === panelId 
        ? { ...item, duration, price: getPanelPrice(item.panel, duration) }
        : item
    ));
  }, []);

  // Toggle cart
  const toggleCart = useCallback(() => {
    console.log('🛒 [UnifiedCart] Toggle carrinho');
    setIsOpen(prev => !prev);
  }, []);

  // Proceed to checkout
  const proceedToCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    
    setIsOpen(false);
    navigate('/plano');
  }, [cartItems.length, navigate]);

  return {
    // State
    cartItems,
    isOpen,
    isAnimating,
    isLoading,
    itemCount: cartItems.length,
    totalPrice: cartItems.reduce((sum, item) => sum + item.price, 0),
    
    // Actions
    addToCart,
    removeFromCart,
    clearCart,
    updateDuration,
    toggleCart,
    proceedToCheckout,
    
    // Utils
    isItemInCart
  };
};
