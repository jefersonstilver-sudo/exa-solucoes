
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { toast } from 'sonner';
import { getPanelPrice } from '@/utils/checkoutUtils';
import { 
  saveCartToStorage, 
  loadCartFromStorage, 
  CART_STORAGE_KEY 
} from '@/services/cartStorageService';

interface CartContextType {
  // Estado do carrinho
  cartItems: CartItem[];
  cartOpen: boolean;
  cartAnimation: boolean;
  initialLoadDone: boolean;
  
  // Verificações
  isItemInCart: (buildingId: string) => boolean;
  getCartItemByBuildingId: (buildingId: string) => CartItem | null;
  
  // Ações do carrinho
  addToCart: (panel: Panel, duration?: number) => void;
  removeFromCart: (panelId: string) => void;
  clearCart: () => void;
  changeDuration: (panelId: string, duration: number) => void;
  
  // Controle da UI
  setCartOpen: (open: boolean) => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Hook para usar o contexto
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Função para converter legacy para CartItem
const convertLegacyToCartItem = (legacyItem: { panel: Panel; duration: number }): CartItem => {
  return {
    id: `cart_${legacyItem.panel.id}_${Date.now()}`,
    panel: legacyItem.panel,
    duration: legacyItem.duration,
    addedAt: Date.now(),
    price: getPanelPrice(legacyItem.panel, legacyItem.duration)
  };
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Carregar carrinho na inicialização
  useEffect(() => {
    console.log('🛒 [CartContext] Carregando carrinho inicial...');
    try {
      const loadedLegacyCart = loadCartFromStorage();
      const fullCartItems = loadedLegacyCart.map(convertLegacyToCartItem);
      setCartItems(fullCartItems);
      setInitialLoadDone(true);
      console.log('🛒 [CartContext] Carrinho carregado:', fullCartItems.length, 'itens');
    } catch (error) {
      console.error('🛒 [CartContext] Erro ao carregar carrinho:', error);
      setInitialLoadDone(true);
    }
  }, []);

  // Salvar carrinho quando items mudam
  useEffect(() => {
    if (!initialLoadDone) return;
    
    console.log('🛒 [CartContext] Salvando carrinho:', cartItems.length, 'itens');
    const legacyCartItems = cartItems.map(item => ({
      panel: item.panel,
      duration: item.duration
    }));
    saveCartToStorage(legacyCartItems);
  }, [cartItems, initialLoadDone]);

  // Verificar se item está no carrinho
  const isItemInCart = useCallback((buildingId: string): boolean => {
    if (!buildingId || !initialLoadDone) return false;
    return cartItems.some(item => item.panel.id === buildingId);
  }, [cartItems, initialLoadDone]);

  // Obter item do carrinho por ID
  const getCartItemByBuildingId = useCallback((buildingId: string): CartItem | null => {
    if (!buildingId || !initialLoadDone) return null;
    return cartItems.find(item => item.panel.id === buildingId) || null;
  }, [cartItems, initialLoadDone]);

  // Adicionar ao carrinho - SINCRONIZAÇÃO INSTANTÂNEA
  const addToCart = useCallback((panel: Panel, duration: number = 30) => {
    console.log('🛒 [CartContext] Adicionando ao carrinho:', panel.id);
    
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.panel.id === panel.id);
      
      if (existingIndex >= 0) {
        // Atualizar item existente
        return prev.map((item, index) => 
          index === existingIndex 
            ? {
                ...item,
                duration,
                price: getPanelPrice(panel, duration),
                addedAt: Date.now()
              }
            : item
        );
      } else {
        // Adicionar novo item
        const newItem: CartItem = {
          id: `cart_${panel.id}_${Date.now()}`,
          panel,
          duration,
          addedAt: Date.now(),
          price: getPanelPrice(panel, duration)
        };
        return [...prev, newItem];
      }
    });
    
    // Animação e abertura do carrinho
    setCartAnimation(true);
    setCartOpen(true);
    
    // Reset da animação
    setTimeout(() => setCartAnimation(false), 300);
    
    // Toast de sucesso
    toast.success(`${panel.buildings?.nome || 'Painel'} adicionado ao carrinho!`, {
      description: "Painel adicionado com sucesso",
      duration: 3000,
    });
  }, []);

  // Remover do carrinho
  const removeFromCart = useCallback((panelId: string) => {
    console.log('🛒 [CartContext] Removendo do carrinho:', panelId);
    
    const panelToRemove = cartItems.find(item => item.panel.id === panelId);
    const panelName = panelToRemove?.panel.buildings?.nome || 'Painel';
    
    setCartItems(prev => prev.filter(item => item.panel.id !== panelId));
    
    toast.success(`${panelName} removido do carrinho`, {
      duration: 3000,
    });
  }, [cartItems]);

  // Limpar carrinho
  const clearCart = useCallback(() => {
    console.log('🛒 [CartContext] Limpando carrinho');
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    
    toast.success('Carrinho limpo', {
      description: "Todos os itens foram removidos",
      duration: 3000,
    });
  }, []);

  // Alterar duração
  const changeDuration = useCallback((panelId: string, duration: number) => {
    console.log('🛒 [CartContext] Alterando duração:', panelId, '→', duration);
    
    setCartItems(prev => prev.map(item => 
      item.panel.id === panelId 
        ? {
            ...item,
            duration,
            price: getPanelPrice(item.panel, duration)
          }
        : item
    ));
  }, []);

  // Toggle do carrinho
  const toggleCart = useCallback(() => {
    console.log('🛒 [CartContext] Alternando estado do carrinho');
    setCartOpen(prev => !prev);
  }, []);

  const value: CartContextType = {
    // Estado
    cartItems,
    cartOpen,
    cartAnimation,
    initialLoadDone,
    
    // Verificações
    isItemInCart,
    getCartItemByBuildingId,
    
    // Ações
    addToCart,
    removeFromCart,
    clearCart,
    changeDuration,
    
    // UI
    setCartOpen,
    toggleCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
