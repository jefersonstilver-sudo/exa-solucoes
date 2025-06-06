
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
  const [forceUpdate, setForceUpdate] = useState(0);
  const navigate = useNavigate();

  // Force re-render function
  const triggerForceUpdate = useCallback(() => {
    console.log('🔄 [UnifiedCart] Triggering force update');
    setForceUpdate(prev => prev + 1);
  }, []);

  // Load cart on mount with detailed logging
  useEffect(() => {
    console.log('🛒 [UnifiedCart] === INICIALIZANDO CARRINHO UNIFICADO ===');
    try {
      const saved = localStorage.getItem(CART_KEY);
      console.log('🛒 [UnifiedCart] localStorage raw data:', saved);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🛒 [UnifiedCart] Parsed data:', parsed);
        
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
          console.log('✅ [UnifiedCart] Carrinho carregado com sucesso:', parsed.length, 'itens');
          parsed.forEach((item, index) => {
            console.log(`🛒 [UnifiedCart] Item ${index + 1}:`, {
              id: item.id,
              panelId: item.panel?.id,
              panelName: item.panel?.buildings?.nome,
              duration: item.duration,
              price: item.price
            });
          });
        } else {
          console.warn('⚠️ [UnifiedCart] Dados não são array, limpando carrinho');
          localStorage.removeItem(CART_KEY);
        }
      } else {
        console.log('📝 [UnifiedCart] Nenhum carrinho salvo encontrado');
      }
    } catch (error) {
      console.error('❌ [UnifiedCart] Erro ao carregar carrinho:', error);
      localStorage.removeItem(CART_KEY);
    } finally {
      setIsLoading(false);
      console.log('✅ [UnifiedCart] Inicialização completa');
    }
  }, []);

  // Save cart when items change with detailed logging
  useEffect(() => {
    if (!isLoading) {
      try {
        console.log('💾 [UnifiedCart] Salvando carrinho:', cartItems.length, 'itens');
        localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
        
        // Log detailed cart state
        cartItems.forEach((item, index) => {
          console.log(`💾 [UnifiedCart] Salvando item ${index + 1}:`, {
            id: item.id,
            panelId: item.panel?.id,
            panelName: item.panel?.buildings?.nome
          });
        });
        
        console.log('✅ [UnifiedCart] Carrinho salvo com sucesso');
        
        // Trigger force update to ensure all components are notified
        triggerForceUpdate();
      } catch (error) {
        console.error('❌ [UnifiedCart] Erro ao salvar carrinho:', error);
      }
    }
  }, [cartItems, isLoading, triggerForceUpdate]);

  // Check if item is in cart with enhanced logging
  const isItemInCart = useCallback((panelId: string): boolean => {
    if (!panelId || isLoading) {
      console.log('🔍 [UnifiedCart] isItemInCart: early return (no panelId or loading)');
      return false;
    }
    
    const inCart = cartItems.some(item => item.panel.id === panelId);
    console.log('🔍 [UnifiedCart] isItemInCart:', panelId, '→', inCart);
    console.log('🔍 [UnifiedCart] Current cart panel IDs:', cartItems.map(item => item.panel.id));
    
    return inCart;
  }, [cartItems, isLoading, forceUpdate]);

  // Add item to cart with enhanced state management
  const addToCart = useCallback((panel: Panel, duration: number = 30) => {
    console.log('🛒 [UnifiedCart] === ADICIONANDO ITEM AO CARRINHO ===');
    console.log('🛒 [UnifiedCart] Panel ID:', panel.id);
    console.log('🛒 [UnifiedCart] Panel Name:', panel.buildings?.nome);
    console.log('🛒 [UnifiedCart] Duration:', duration);
    console.log('🛒 [UnifiedCart] Current cart size BEFORE:', cartItems.length);
    
    setCartItems(prev => {
      console.log('🔄 [UnifiedCart] Previous cart state:', prev.length, 'items');
      
      const existingIndex = prev.findIndex(item => item.panel.id === panel.id);
      console.log('🔍 [UnifiedCart] Existing item index:', existingIndex);
      
      let newCartItems;
      if (existingIndex >= 0) {
        // Update existing item
        console.log('🔄 [UnifiedCart] Updating existing item');
        newCartItems = prev.map((item, index) => 
          index === existingIndex 
            ? { ...item, duration, price: getPanelPrice(panel, duration), addedAt: Date.now() }
            : item
        );
      } else {
        // Add new item
        console.log('➕ [UnifiedCart] Adding new item');
        const newItem = createCartItem(panel, duration);
        console.log('➕ [UnifiedCart] New item created:', newItem);
        newCartItems = [...prev, newItem];
      }
      
      console.log('✅ [UnifiedCart] New cart state:', newCartItems.length, 'items');
      return newCartItems;
    });

    // Trigger animation and open cart with proper timing
    console.log('🎬 [UnifiedCart] Starting animation and opening cart');
    setIsAnimating(true);
    
    // Use setTimeout to ensure state is updated before opening
    setTimeout(() => {
      console.log('📖 [UnifiedCart] Opening cart drawer');
      setIsOpen(true);
    }, 50);
    
    // Reset animation after duration
    setTimeout(() => {
      console.log('🎬 [UnifiedCart] Stopping animation');
      setIsAnimating(false);
    }, 800);

    // Log event
    logCheckoutEvent(
      CheckoutEvent.ADD_TO_CART,
      LogLevel.INFO,
      "Item adicionado ao carrinho unificado",
      { panelId: panel.id, duration }
    );

    // Show success toast
    toast.success(`${panel.buildings?.nome || 'Painel'} adicionado ao carrinho!`);
    
    console.log('✅ [UnifiedCart] === ITEM ADICIONADO COM SUCESSO ===');
  }, [cartItems]);

  // Remove item from cart
  const removeFromCart = useCallback((panelId: string) => {
    console.log('🗑️ [UnifiedCart] Removendo item:', panelId);
    
    const itemToRemove = cartItems.find(item => item.panel.id === panelId);
    setCartItems(prev => prev.filter(item => item.panel.id !== panelId));
    
    toast.success(`${itemToRemove?.panel.buildings?.nome || 'Painel'} removido do carrinho`);
  }, [cartItems]);

  // Clear cart
  const clearCart = useCallback(() => {
    console.log('🧹 [UnifiedCart] Limpando carrinho');
    setCartItems([]);
    localStorage.removeItem(CART_KEY);
    toast.success('Carrinho limpo');
  }, []);

  // Update duration
  const updateDuration = useCallback((panelId: string, duration: number) => {
    console.log('📅 [UnifiedCart] Atualizando duração:', panelId, duration);
    
    setCartItems(prev => prev.map(item => 
      item.panel.id === panelId 
        ? { ...item, duration, price: getPanelPrice(item.panel, duration) }
        : item
    ));
  }, []);

  // Toggle cart
  const toggleCart = useCallback(() => {
    console.log('🔄 [UnifiedCart] Toggle carrinho - Estado atual:', isOpen);
    setIsOpen(prev => {
      const newState = !prev;
      console.log('🔄 [UnifiedCart] Novo estado do carrinho:', newState);
      return newState;
    });
  }, [isOpen]);

  // Proceed to checkout
  const proceedToCheckout = useCallback(() => {
    console.log('🛒➡️ [UnifiedCart] Proceeding to checkout');
    if (cartItems.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    
    setIsOpen(false);
    navigate('/plano');
  }, [cartItems.length, navigate]);

  // Enhanced state logging
  useEffect(() => {
    console.log('📊 [UnifiedCart] === ESTADO ATUAL DO CARRINHO ===');
    console.log('📊 [UnifiedCart] Items count:', cartItems.length);
    console.log('📊 [UnifiedCart] Is open:', isOpen);
    console.log('📊 [UnifiedCart] Is animating:', isAnimating);
    console.log('📊 [UnifiedCart] Is loading:', isLoading);
    console.log('📊 [UnifiedCart] Force update counter:', forceUpdate);
  }, [cartItems, isOpen, isAnimating, isLoading, forceUpdate]);

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
    isItemInCart,
    
    // Debug
    forceUpdate,
    triggerForceUpdate
  };
};
