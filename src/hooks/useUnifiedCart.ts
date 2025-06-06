
import { useState, useEffect, useCallback, useRef } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getPanelPrice } from '@/utils/checkoutUtils';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

const CART_KEY = 'indexa_unified_cart';

// Simplified cart item creation with validation
const createCartItem = (panel: Panel, duration: number = 30): CartItem => {
  if (!panel || !panel.id) {
    throw new Error('Panel ou panel.id está undefined');
  }
  
  return {
    id: `cart_${panel.id}_${Date.now()}`,
    panel,
    duration,
    addedAt: Date.now(),
    price: getPanelPrice(panel, duration)
  };
};

// Debounce helper
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

export const useUnifiedCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncVersion, setSyncVersion] = useState(0);
  const navigate = useNavigate();
  const addingRef = useRef<Set<string>>(new Set());

  console.log('🛒 [UnifiedCart] === HOOK RENDERIZADO ===');
  console.log('🛒 [UnifiedCart] cartItems.length:', cartItems.length);
  console.log('🛒 [UnifiedCart] isOpen:', isOpen);
  console.log('🛒 [UnifiedCart] isAnimating:', isAnimating);
  console.log('🛒 [UnifiedCart] syncVersion:', syncVersion);

  // Force sync function
  const forceSync = useCallback(() => {
    console.log('🔄 [UnifiedCart] Forcing sync update');
    setSyncVersion(prev => prev + 1);
  }, []);

  // Load cart on mount with validation
  useEffect(() => {
    console.log('🛒 [UnifiedCart] === INICIALIZANDO CARRINHO ===');
    try {
      const saved = localStorage.getItem(CART_KEY);
      console.log('🛒 [UnifiedCart] localStorage raw:', saved);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🛒 [UnifiedCart] Parsed data:', parsed);
        
        if (Array.isArray(parsed)) {
          // Validate each item
          const validItems = parsed.filter(item => {
            const isValid = item && item.panel && item.panel.id && typeof item.duration === 'number';
            if (!isValid) {
              console.warn('⚠️ [UnifiedCart] Item inválido removido:', item);
            }
            return isValid;
          });
          
          setCartItems(validItems);
          console.log('✅ [UnifiedCart] Carrinho carregado:', validItems.length, 'itens válidos');
        } else {
          console.warn('⚠️ [UnifiedCart] Dados não são array, limpando');
          localStorage.removeItem(CART_KEY);
        }
      } else {
        console.log('📝 [UnifiedCart] Nenhum carrinho encontrado');
      }
    } catch (error) {
      console.error('❌ [UnifiedCart] Erro ao carregar:', error);
      localStorage.removeItem(CART_KEY);
    } finally {
      setIsLoading(false);
      console.log('✅ [UnifiedCart] Inicialização completa');
    }
  }, []);

  // Save cart with integrity check
  useEffect(() => {
    if (!isLoading) {
      try {
        console.log('💾 [UnifiedCart] Salvando carrinho:', cartItems.length);
        
        // Validate before saving
        const validItems = cartItems.filter(item => 
          item && item.panel && item.panel.id && typeof item.duration === 'number'
        );
        
        if (validItems.length !== cartItems.length) {
          console.warn('⚠️ [UnifiedCart] Itens inválidos detectados durante salvamento');
          setCartItems(validItems);
          return;
        }
        
        localStorage.setItem(CART_KEY, JSON.stringify(validItems));
        
        // Log detailed state
        validItems.forEach((item, index) => {
          console.log(`💾 [UnifiedCart] Item ${index + 1}:`, {
            id: item.id,
            panelId: item.panel?.id,
            panelName: item.panel?.buildings?.nome,
            duration: item.duration,
            price: item.price
          });
        });
        
        forceSync();
        console.log('✅ [UnifiedCart] Carrinho salvo com sucesso');
      } catch (error) {
        console.error('❌ [UnifiedCart] Erro ao salvar:', error);
      }
    }
  }, [cartItems, isLoading, forceSync]);

  // Improved isItemInCart with detailed logging
  const isItemInCart = useCallback((panelId: string): boolean => {
    if (!panelId || isLoading) {
      console.log('🔍 [UnifiedCart] isItemInCart early return:', { panelId, isLoading });
      return false;
    }
    
    const inCart = cartItems.some(item => {
      const match = item.panel?.id === panelId;
      console.log('🔍 [UnifiedCart] Comparing:', { 
        itemPanelId: item.panel?.id, 
        searchPanelId: panelId, 
        match 
      });
      return match;
    });
    
    console.log('🔍 [UnifiedCart] isItemInCart result:', { panelId, inCart, cartItemsCount: cartItems.length });
    console.log('🔍 [UnifiedCart] Current cart panel IDs:', cartItems.map(item => item.panel?.id));
    
    return inCart;
  }, [cartItems, isLoading, syncVersion]);

  // Debounced add to cart with duplicate prevention
  const addToCartInternal = useCallback(async (panel: Panel, duration: number = 30) => {
    console.log('🛒 [UnifiedCart] === ADICIONANDO ITEM ===');
    console.log('🛒 [UnifiedCart] Panel:', { id: panel.id, name: panel.buildings?.nome });
    console.log('🛒 [UnifiedCart] Duration:', duration);
    console.log('🛒 [UnifiedCart] Currently adding:', Array.from(addingRef.current));

    // Prevent duplicate additions
    if (addingRef.current.has(panel.id)) {
      console.warn('⚠️ [UnifiedCart] Já adicionando este item, ignorando');
      return;
    }

    // Mark as adding
    addingRef.current.add(panel.id);

    try {
      setCartItems(prev => {
        console.log('🔄 [UnifiedCart] Estado anterior:', prev.length, 'itens');
        
        const existingIndex = prev.findIndex(item => item.panel?.id === panel.id);
        console.log('🔍 [UnifiedCart] Índice existente:', existingIndex);
        
        let newCartItems;
        if (existingIndex >= 0) {
          console.log('🔄 [UnifiedCart] Atualizando item existente');
          newCartItems = prev.map((item, index) => 
            index === existingIndex 
              ? { ...item, duration, price: getPanelPrice(panel, duration), addedAt: Date.now() }
              : item
          );
        } else {
          console.log('➕ [UnifiedCart] Adicionando novo item');
          const newItem = createCartItem(panel, duration);
          console.log('➕ [UnifiedCart] Novo item:', newItem);
          newCartItems = [...prev, newItem];
        }
        
        console.log('✅ [UnifiedCart] Novo estado:', newCartItems.length, 'itens');
        return newCartItems;
      });

      // Start animation
      console.log('🎬 [UnifiedCart] Iniciando animação');
      setIsAnimating(true);
      
      // Open cart after state update
      setTimeout(() => {
        console.log('📖 [UnifiedCart] Abrindo carrinho');
        setIsOpen(true);
      }, 100);
      
      // Stop animation
      setTimeout(() => {
        console.log('🎬 [UnifiedCart] Parando animação');
        setIsAnimating(false);
      }, 1000);

      // Log event
      logCheckoutEvent(
        CheckoutEvent.ADD_TO_CART,
        LogLevel.INFO,
        "Item adicionado ao carrinho unificado",
        { panelId: panel.id, duration }
      );

      // Success toast
      toast.success(`${panel.buildings?.nome || 'Painel'} adicionado ao carrinho!`);
      
      console.log('✅ [UnifiedCart] === ADIÇÃO CONCLUÍDA ===');
    } catch (error) {
      console.error('❌ [UnifiedCart] Erro ao adicionar:', error);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      // Remove from adding set after delay
      setTimeout(() => {
        addingRef.current.delete(panel.id);
        console.log('🔄 [UnifiedCart] Removido do set de adição:', panel.id);
      }, 1000);
    }
  }, []);

  // Debounced version
  const addToCart = useDebounce(addToCartInternal, 300);

  // Remove item from cart
  const removeFromCart = useCallback((panelId: string) => {
    console.log('🗑️ [UnifiedCart] Removendo item:', panelId);
    
    const itemToRemove = cartItems.find(item => item.panel?.id === panelId);
    setCartItems(prev => prev.filter(item => item.panel?.id !== panelId));
    
    toast.success(`${itemToRemove?.panel.buildings?.nome || 'Painel'} removido do carrinho`);
  }, [cartItems]);

  // Clear cart with confirmation
  const clearCart = useCallback(() => {
    console.log('🧹 [UnifiedCart] Limpando carrinho');
    setCartItems([]);
    localStorage.removeItem(CART_KEY);
    addingRef.current.clear();
    forceSync();
    toast.success('Carrinho limpo');
  }, [forceSync]);

  // Update duration
  const updateDuration = useCallback((panelId: string, duration: number) => {
    console.log('📅 [UnifiedCart] Atualizando duração:', { panelId, duration });
    
    setCartItems(prev => prev.map(item => 
      item.panel?.id === panelId 
        ? { ...item, duration, price: getPanelPrice(item.panel, duration) }
        : item
    ));
  }, []);

  // Toggle cart
  const toggleCart = useCallback(() => {
    console.log('🔄 [UnifiedCart] Toggle carrinho - atual:', isOpen);
    setIsOpen(prev => {
      const newState = !prev;
      console.log('🔄 [UnifiedCart] Novo estado:', newState);
      return newState;
    });
  }, [isOpen]);

  // Proceed to checkout
  const proceedToCheckout = useCallback(() => {
    console.log('🛒➡️ [UnifiedCart] Prosseguindo para checkout');
    if (cartItems.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    
    setIsOpen(false);
    navigate('/plano');
  }, [cartItems.length, navigate]);

  // Debug function to clear problematic state
  const debugClearCache = useCallback(() => {
    console.log('🔧 [UnifiedCart] DEBUG: Limpando cache');
    localStorage.removeItem(CART_KEY);
    setCartItems([]);
    addingRef.current.clear();
    setIsOpen(false);
    setIsAnimating(false);
    forceSync();
    toast.success('Cache limpo - Debug');
  }, [forceSync]);

  // Enhanced state logging
  useEffect(() => {
    console.log('📊 [UnifiedCart] === ESTADO DETALHADO ===');
    console.log('📊 [UnifiedCart] Items:', cartItems.length);
    console.log('📊 [UnifiedCart] Open:', isOpen);
    console.log('📊 [UnifiedCart] Animating:', isAnimating);
    console.log('📊 [UnifiedCart] Loading:', isLoading);
    console.log('📊 [UnifiedCart] Sync version:', syncVersion);
    console.log('📊 [UnifiedCart] Adding set:', Array.from(addingRef.current));
    console.log('📊 [UnifiedCart] Panel IDs:', cartItems.map(item => item.panel?.id));
  }, [cartItems, isOpen, isAnimating, isLoading, syncVersion]);

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
    forceSync,
    
    // Debug
    debugClearCache,
    syncVersion
  };
};
