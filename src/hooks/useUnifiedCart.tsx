
import { useState, useEffect, useCallback } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { toast } from 'sonner';
import { findCartItems, saveCartItems, clearAllCarts, CART_STORAGE_KEYS } from '@/utils/cartUtils';
import { calculatePixPrice } from '@/utils/priceCalculator';

export const useUnifiedCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateSource, setLastUpdateSource] = useState<string>('');

  // Carregar carrinho na inicialização
  useEffect(() => {
    console.log("🛒 [useUnifiedCart] Iniciando carregamento do carrinho");
    
    const result = findCartItems();
    
    if (result.success) {
      setCartItems(result.cartItems);
      setLastUpdateSource(result.usedKey);
      console.log("✅ [useUnifiedCart] Carrinho carregado:", {
        itemCount: result.cartItems.length,
        source: result.usedKey,
        items: result.cartItems.map(item => ({
          id: item.id,
          panelId: item.panel?.id,
          buildingName: item.panel?.buildings?.nome
          // REMOVIDO: price - será calculado dinamicamente
        }))
      });
    } else {
      console.log("⚠️ [useUnifiedCart] Nenhum carrinho encontrado, iniciando vazio");
      setCartItems([]);
    }
    
    setIsLoading(false);
  }, []);

  // Salvar carrinho quando houver mudanças
  useEffect(() => {
    if (!isLoading && cartItems.length >= 0) {
      const success = saveCartItems(cartItems);
      if (success) {
        console.log("💾 [useUnifiedCart] Carrinho salvo:", cartItems.length, "itens");
      }
    }
  }, [cartItems, isLoading]);

  const addToCart = useCallback((panel: Panel, duration: number = 30) => {
    console.log("➕ [useUnifiedCart] Adicionando ao carrinho:", {
      panelId: panel.id,
      buildingName: panel.buildings?.nome,
      duration
    });

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.panel?.id === panel.id);
      
      if (existingIndex >= 0) {
        // Atualizar item existente
        const updated = prev.map((item, index) => 
          index === existingIndex 
            ? { 
                ...item, 
                duration, 
                addedAt: Date.now() 
                // REMOVIDO: price - será calculado dinamicamente
              }
            : item
        );
        
        toast.success(`${panel.buildings?.nome || 'Painel'} atualizado no carrinho!`);
        return updated;
      } else {
        // Adicionar novo item
        const newItem: CartItem = {
          id: `cart_${panel.id}_${Date.now()}`,
          panel,
          duration,
          addedAt: Date.now()
          // REMOVIDO: price - será calculado dinamicamente
        };
        
        toast.success(`${panel.buildings?.nome || 'Painel'} adicionado ao carrinho!`);
        return [...prev, newItem];
      }
    });
  }, []);

  const removeFromCart = useCallback((panelId: string) => {
    const item = cartItems.find(item => item.panel?.id === panelId);
    
    setCartItems(prev => prev.filter(item => item.panel?.id !== panelId));
    
    toast.success(`${item?.panel?.buildings?.nome || 'Painel'} removido do carrinho`);
    
    console.log("➖ [useUnifiedCart] Item removido:", panelId);
  }, [cartItems]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    clearAllCarts();
    toast.success('Carrinho limpo');
    console.log("🧹 [useUnifiedCart] Carrinho limpo");
  }, []);

  const updateDuration = useCallback((panelId: string, duration: number) => {
    setCartItems(prev => prev.map(item => 
      item.panel?.id === panelId 
        ? { 
            ...item, 
            duration
            // REMOVIDO: price - será calculado dinamicamente
          }
        : item
    ));
    
    console.log("🔄 [useUnifiedCart] Duração atualizada:", { panelId, duration });
  }, []);

  const isItemInCart = useCallback((panelId: string): boolean => {
    return cartItems.some(item => item.panel?.id === panelId);
  }, [cartItems]);

  // CORRIGIDO: Calcular preço total usando calculador centralizado
  const getTotalPrice = useCallback(() => {
    const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1');
    return calculatePixPrice(selectedPlan, cartItems, 0);
  }, [cartItems]);

  return {
    cartItems,
    isLoading,
    itemCount: cartItems.length,
    totalPrice: getTotalPrice(),
    lastUpdateSource,
    isItemInCart,
    addToCart,
    removeFromCart,
    clearCart,
    updateDuration
  };
};
