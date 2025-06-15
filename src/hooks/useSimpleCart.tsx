
import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUserSession } from './useUserSession';

export const useSimpleCart = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUserSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('indexa_cart');
      if (saved) {
        const parsedCart = JSON.parse(saved);
        if (Array.isArray(parsedCart)) {
          const validCartItems = parsedCart.map((item: any, index: number) => ({
            id: item.id || `cart_${item.panel?.id || index}_${Date.now()}`,
            panel: item.panel,
            duration: item.duration || 30,
            addedAt: item.addedAt || Date.now(),
            price: item.price || (item.panel?.buildings?.preco_base * (item.duration || 30)) || 0
          }));
          setCartItems(validCartItems);
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      localStorage.removeItem('indexa_cart');
    }
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem('indexa_cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cartItems]);

  const addToCart = (panel: Panel, duration: number = 30) => {
    console.log('🛒 [SimpleCart] Adicionando ao carrinho:', { panelId: panel.id, duration });
    
    const existingItemIndex = cartItems.findIndex(item => item.panel.id === panel.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        duration,
        price: (panel.buildings?.preco_base || 0) * duration
      };
      setCartItems(updatedItems);
      toast.success("Item atualizado no carrinho!");
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `cart_${panel.id}_${Date.now()}`,
        panel,
        duration,
        addedAt: Date.now(),
        price: (panel.buildings?.preco_base || 0) * duration
      };
      setCartItems(prev => [...prev, newItem]);
      toast.success("Item adicionado ao carrinho!");
    }

    // Brief animation feedback
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const removeFromCart = (itemId: string) => {
    console.log('🛒 [SimpleCart] Removendo do carrinho:', itemId);
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    toast.success("Item removido do carrinho!");
  };

  const updateDuration = (itemId: string, duration: number) => {
    console.log('🛒 [SimpleCart] Atualizando duração:', { itemId, duration });
    setCartItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            duration, 
            price: (item.panel.buildings?.preco_base || 0) * duration 
          }
        : item
    ));
  };

  const clearCart = () => {
    console.log('🛒 [SimpleCart] Limpando carrinho');
    setCartItems([]);
    localStorage.removeItem('indexa_cart');
    toast.success("Carrinho limpo!");
  };

  const toggleCart = () => {
    setIsOpen(prev => !prev);
  };

  const isItemInCart = (panelId: string): boolean => {
    return cartItems.some(item => item.panel.id === panelId);
  };

  const proceedToCheckout = () => {
    console.log('🛒 [SimpleCart] Iniciando checkout:', {
      cartItemsCount: cartItems.length,
      isLoggedIn,
      userId: user?.id,
      isNavigating
    });

    // Prevent multiple navigation attempts
    if (isNavigating) {
      console.warn('🛒 [SimpleCart] Navegação já em andamento');
      return;
    }

    // Validate cart
    if (cartItems.length === 0) {
      toast.error("Seu carrinho está vazio!");
      return;
    }

    setIsNavigating(true);

    try {
      // Check authentication
      if (!isLoggedIn || !user?.id) {
        console.log('🛒 [SimpleCart] Usuário não autenticado, redirecionando para login');
        toast.info("Faça login para continuar com a compra");
        navigate('/login?redirect=/selecionar-plano');
        return;
      }

      // Close cart and navigate
      setIsOpen(false);
      
      // Navigate to plan selection
      console.log('🛒 [SimpleCart] Navegando para seleção de plano');
      navigate('/selecionar-plano');
      
      toast.success("Redirecionando para checkout...");
    } catch (error) {
      console.error('🛒 [SimpleCart] Erro durante checkout:', error);
      toast.error("Erro ao processar checkout. Tente novamente.");
    } finally {
      // Reset navigation state after a delay
      setTimeout(() => {
        setIsNavigating(false);
      }, 2000);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  const getItemCount = () => {
    return cartItems.length;
  };

  return {
    // State
    cartItems,
    isOpen,
    isAnimating,
    isNavigating,
    
    // Actions
    addToCart,
    removeFromCart,
    updateDuration,
    clearCart,
    proceedToCheckout,
    setIsOpen,
    toggleCart,
    
    // Computed
    getTotalPrice,
    getItemCount,
    isItemInCart,
    
    // Computed aliases for compatibility
    itemCount: getItemCount(),
    
    // Compatibility with existing code
    setCartItems,
    setIsAnimating,
    setIsNavigating
  };
};
