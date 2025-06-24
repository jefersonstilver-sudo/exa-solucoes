
import { useState, useEffect, useCallback } from 'react';
import { Panel } from '@/types/panel';
import { CartItem } from '@/types/cart';
import { modernCartService } from '@/services/modernCartService';
import { useToast } from '@/hooks/use-toast';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { calculateRegularPrice } from '@/utils/priceCalculator';
import { PlanKey } from '@/types/checkout';

export const useModernCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const { toast } = useToast();

  // Carregar carrinho na inicialização
  useEffect(() => {
    const items = modernCartService.loadCart();
    setCartItems(items);
    setIsLoading(false);

    // Subscrever mudanças
    const unsubscribe = modernCartService.subscribe((newItems) => {
      setCartItems(newItems);
    });

    return unsubscribe;
  }, []);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 800);
  }, []);

  const addToCart = useCallback((panel: Panel, duration: number = 30) => {
    try {
      const basePrice = panel.buildings?.preco_base || 280;
      const updatedItems = modernCartService.addItem(panel, duration);
      
      triggerAnimation();
      
      logCheckoutEvent(
        CheckoutEvent.ADD_TO_CART,
        LogLevel.INFO,
        "Item adicionado ao carrinho moderno",
        { 
          panelId: panel.id, 
          duration, 
          basePrice, // PREÇO REAL DO PRÉDIO
          itemCount: updatedItems.length 
        }
      );

      toast({
        title: "✅ Painel adicionado",
        description: `${panel.buildings?.nome || 'Painel'} foi adicionado ao seu carrinho (R$ ${basePrice}/mês)`,
      });

      return updatedItems;
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível adicionar o painel ao carrinho",
        variant: "destructive"
      });
      return cartItems;
    }
  }, [triggerAnimation, toast, cartItems]);

  const removeFromCart = useCallback((panelId: string) => {
    try {
      const itemToRemove = cartItems.find(item => item.panel.id === panelId);
      const updatedItems = modernCartService.removeItem(panelId);
      
      logCheckoutEvent(
        CheckoutEvent.REMOVE_FROM_CART,
        LogLevel.INFO,
        "Item removido do carrinho moderno",
        { panelId, itemCount: updatedItems.length }
      );

      toast({
        title: "🗑️ Painel removido",
        description: `${itemToRemove?.panel.buildings?.nome || 'Painel'} foi removido do carrinho`,
      });

      return updatedItems;
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
      return cartItems;
    }
  }, [cartItems, toast]);

  const updateDuration = useCallback((panelId: string, duration: number) => {
    try {
      const updatedItems = modernCartService.updateItemDuration(panelId, duration);
      
      const item = updatedItems.find(item => item.panel.id === panelId);
      const months = duration / 30;
      
      logCheckoutEvent(
        CheckoutEvent.UPDATE_CART,
        LogLevel.INFO,
        "Duração atualizada no carrinho moderno",
        { panelId, newDuration: duration }
      );

      if (item) {
        toast({
          title: "📅 Duração atualizada",
          description: `${item.panel.buildings?.nome}: ${months} ${months === 1 ? 'mês' : 'meses'}`,
        });
      }

      return updatedItems;
    } catch (error) {
      console.error('Erro ao atualizar duração:', error);
      return cartItems;
    }
  }, [cartItems, toast]);

  const clearCart = useCallback(() => {
    try {
      const updatedItems = modernCartService.clearCart();
      
      logCheckoutEvent(
        CheckoutEvent.CLEAR_CART,
        LogLevel.INFO,
        "Carrinho moderno limpo",
        { previousItemCount: cartItems.length }
      );

      toast({
        title: "🧹 Carrinho limpo",
        description: "Todos os itens foram removidos do seu carrinho",
      });

      return updatedItems;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      return cartItems;
    }
  }, [cartItems, toast]);

  const getAnalytics = useCallback(() => {
    return modernCartService.getCartAnalytics();
  }, []);

  // PREÇO CALCULADO DINAMICAMENTE BASEADO NO preco_base DOS PRÉDIOS - SEM DESCONTO PIX
  const getTotalPrice = useCallback(() => {
    const selectedPlan = parseInt(localStorage.getItem('selectedPlan') || '1') as PlanKey;
    return calculateRegularPrice(selectedPlan, cartItems, 0);
  }, [cartItems]);

  return {
    // Estado
    cartItems,
    isLoading,
    isAnimating,
    itemCount: cartItems.length,
    totalPrice: getTotalPrice(),
    
    // Ações
    addToCart,
    removeFromCart,
    updateDuration,
    clearCart,
    
    // Utilidades
    getAnalytics,
    
    // Para compatibilidade com código existente
    handleAddToCart: addToCart,
    handleRemoveFromCart: removeFromCart,
    handleChangeDuration: updateDuration,
    handleClearCart: clearCart
  };
};
