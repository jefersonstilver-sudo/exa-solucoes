
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getPanelPrice } from '@/utils/checkoutUtils';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

const CART_KEY = 'indexa_unified_cart';

interface CartContextType {
  // State
  cartItems: CartItem[];
  isOpen: boolean;
  isAnimating: boolean;
  isLoading: boolean;
  itemCount: number;
  totalPrice: number;
  syncVersion: number;
  
  // Actions
  addToCart: (panel: Panel, duration?: number) => Promise<void>;
  removeFromCart: (panelId: string) => void;
  clearCart: () => void;
  updateDuration: (panelId: string, duration: number) => void;
  toggleCart: () => void;
  proceedToCheckout: () => void;
  
  // Utils
  isItemInCart: (panelId: string) => boolean;
  forceSync: () => void;
  debugClearCache: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

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

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncVersion, setSyncVersion] = useState(0);
  const navigate = useNavigate();
  const addingRef = useRef<Set<string>>(new Set());

  console.log('🛒 [CartProvider] === PROVIDER RENDERIZADO ===');
  console.log('🛒 [CartProvider] cartItems.length:', cartItems.length);
  console.log('🛒 [CartProvider] syncVersion:', syncVersion);

  // Force sync function
  const forceSync = useCallback(() => {
    console.log('🔄 [CartProvider] Forcing sync update');
    setSyncVersion(prev => prev + 1);
  }, []);

  // Load cart on mount with validation
  useEffect(() => {
    console.log('🛒 [CartProvider] === INICIALIZANDO CARRINHO GLOBAL ===');
    try {
      const saved = localStorage.getItem(CART_KEY);
      console.log('🛒 [CartProvider] localStorage raw:', saved);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🛒 [CartProvider] Parsed data:', parsed);
        
        if (Array.isArray(parsed)) {
          // Validate each item
          const validItems = parsed.filter(item => {
            const isValid = item && item.panel && item.panel.id && typeof item.duration === 'number';
            if (!isValid) {
              console.warn('⚠️ [CartProvider] Item inválido removido:', item);
            }
            return isValid;
          });
          
          setCartItems(validItems);
          console.log('✅ [CartProvider] Carrinho carregado:', validItems.length, 'itens válidos');
        } else {
          console.warn('⚠️ [CartProvider] Dados não são array, limpando');
          localStorage.removeItem(CART_KEY);
        }
      } else {
        console.log('📝 [CartProvider] Nenhum carrinho encontrado');
      }
    } catch (error) {
      console.error('❌ [CartProvider] Erro ao carregar:', error);
      localStorage.removeItem(CART_KEY);
    } finally {
      setIsLoading(false);
      console.log('✅ [CartProvider] Inicialização completa');
    }
  }, []);

  // Save cart with integrity check and broadcast changes
  useEffect(() => {
    if (!isLoading) {
      try {
        console.log('💾 [CartProvider] Salvando carrinho:', cartItems.length);
        
        // Validate before saving
        const validItems = cartItems.filter(item => 
          item && item.panel && item.panel.id && typeof item.duration === 'number'
        );
        
        if (validItems.length !== cartItems.length) {
          console.warn('⚠️ [CartProvider] Itens inválidos detectados durante salvamento');
          setCartItems(validItems);
          return;
        }
        
        localStorage.setItem(CART_KEY, JSON.stringify(validItems));
        
        // Broadcast change to other components/tabs
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
          detail: { items: validItems, version: syncVersion + 1 } 
        }));
        
        forceSync();
        console.log('✅ [CartProvider] Carrinho salvo e sincronizado');
      } catch (error) {
        console.error('❌ [CartProvider] Erro ao salvar:', error);
      }
    }
  }, [cartItems, isLoading, forceSync, syncVersion]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_KEY && e.newValue) {
        try {
          const newItems = JSON.parse(e.newValue);
          console.log('🔄 [CartProvider] Sincronizando do storage externo');
          setCartItems(newItems);
          forceSync();
        } catch (error) {
          console.error('❌ [CartProvider] Erro ao sincronizar storage:', error);
        }
      }
    };

    const handleCartUpdate = (e: CustomEvent) => {
      console.log('🔄 [CartProvider] Recebido evento de atualização do carrinho');
      setSyncVersion(e.detail.version);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    };
  }, [forceSync]);

  // Check if item is in cart
  const isItemInCart = useCallback((panelId: string): boolean => {
    if (!panelId || isLoading) {
      return false;
    }
    
    const inCart = cartItems.some(item => item.panel?.id === panelId);
    console.log('🔍 [CartProvider] isItemInCart:', { panelId, inCart, itemCount: cartItems.length });
    return inCart;
  }, [cartItems, isLoading]);

  // Add to cart with duplicate prevention
  const addToCart = useCallback(async (panel: Panel, duration: number = 30) => {
    console.log('🛒 [CartProvider] === ADICIONANDO ITEM GLOBAL ===');
    console.log('🛒 [CartProvider] Panel:', { id: panel.id, name: panel.buildings?.nome });

    // Prevent duplicate additions
    if (addingRef.current.has(panel.id)) {
      console.warn('⚠️ [CartProvider] Já adicionando este item, ignorando');
      return;
    }

    // Mark as adding
    addingRef.current.add(panel.id);

    try {
      setCartItems(prev => {
        console.log('🔄 [CartProvider] Estado anterior:', prev.length, 'itens');
        
        const existingIndex = prev.findIndex(item => item.panel?.id === panel.id);
        console.log('🔍 [CartProvider] Índice existente:', existingIndex);
        
        let newCartItems;
        if (existingIndex >= 0) {
          console.log('🔄 [CartProvider] Atualizando item existente');
          newCartItems = prev.map((item, index) => 
            index === existingIndex 
              ? { ...item, duration, price: getPanelPrice(panel, duration), addedAt: Date.now() }
              : item
          );
        } else {
          console.log('➕ [CartProvider] Adicionando novo item');
          const newItem = createCartItem(panel, duration);
          newCartItems = [...prev, newItem];
        }
        
        console.log('✅ [CartProvider] Novo estado:', newCartItems.length, 'itens');
        return newCartItems;
      });

      // Start animation and open cart
      setIsAnimating(true);
      setTimeout(() => setIsOpen(true), 100);
      setTimeout(() => setIsAnimating(false), 1000);

      // Log event
      logCheckoutEvent(
        CheckoutEvent.ADD_TO_CART,
        LogLevel.INFO,
        "Item adicionado ao carrinho global",
        { panelId: panel.id, duration }
      );

      toast.success(`${panel.buildings?.nome || 'Painel'} adicionado ao carrinho!`);
      
      console.log('✅ [CartProvider] === ADIÇÃO GLOBAL CONCLUÍDA ===');
    } catch (error) {
      console.error('❌ [CartProvider] Erro ao adicionar:', error);
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      // Remove from adding set after delay
      setTimeout(() => {
        addingRef.current.delete(panel.id);
      }, 1000);
    }
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((panelId: string) => {
    console.log('🗑️ [CartProvider] Removendo item:', panelId);
    
    const itemToRemove = cartItems.find(item => item.panel?.id === panelId);
    setCartItems(prev => prev.filter(item => item.panel?.id !== panelId));
    
    toast.success(`${itemToRemove?.panel.buildings?.nome || 'Painel'} removido do carrinho`);
  }, [cartItems]);

  // Clear cart
  const clearCart = useCallback(() => {
    console.log('🧹 [CartProvider] Limpando carrinho');
    setCartItems([]);
    localStorage.removeItem(CART_KEY);
    addingRef.current.clear();
    forceSync();
    toast.success('Carrinho limpo');
  }, [forceSync]);

  // Update duration
  const updateDuration = useCallback((panelId: string, duration: number) => {
    console.log('📅 [CartProvider] Atualizando duração:', { panelId, duration });
    
    setCartItems(prev => prev.map(item => 
      item.panel?.id === panelId 
        ? { ...item, duration, price: getPanelPrice(item.panel, duration) }
        : item
    ));
  }, []);

  // Toggle cart
  const toggleCart = useCallback(() => {
    console.log('🔄 [CartProvider] Toggle carrinho - atual:', isOpen);
    setIsOpen(prev => !prev);
  }, [isOpen]);

  // Proceed to checkout
  const proceedToCheckout = useCallback(() => {
    console.log('🛒➡️ [CartProvider] Prosseguindo para checkout');
    if (cartItems.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    
    setIsOpen(false);
    navigate('/plano');
  }, [cartItems.length, navigate]);

  // Debug function
  const debugClearCache = useCallback(() => {
    console.log('🔧 [CartProvider] DEBUG: Limpando cache');
    localStorage.removeItem(CART_KEY);
    setCartItems([]);
    addingRef.current.clear();
    setIsOpen(false);
    setIsAnimating(false);
    forceSync();
    toast.success('Cache limpo - Debug');
  }, [forceSync]);

  const contextValue: CartContextType = {
    // State
    cartItems,
    isOpen,
    isAnimating,
    isLoading,
    itemCount: cartItems.length,
    totalPrice: cartItems.reduce((sum, item) => sum + item.price, 0),
    syncVersion,
    
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
    debugClearCache
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};
