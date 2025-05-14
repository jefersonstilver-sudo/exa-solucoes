
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface UseCartCheckoutOptions {
  cartItems: CartItem[];
  setIsNavigating: (isNavigating: boolean) => void;
  setCartOpen: (isOpen: boolean) => void;
}

export const useCartCheckout = ({ 
  cartItems, 
  setIsNavigating,
  setCartOpen
}: UseCartCheckoutOptions) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCheckoutProcessed, setIsCheckoutProcessed] = useState(false);
  const [navigationAttempts, setNavigationAttempts] = useState(0);
  
  // Resetar status de checkout processado ao mudar itens do carrinho
  useEffect(() => {
    if (isCheckoutProcessed && cartItems.length > 0) {
      setIsCheckoutProcessed(false);
      setNavigationAttempts(0);
    }
  }, [cartItems.length, isCheckoutProcessed]);
  
  // Função de navegação segura mais simples e robusta
  const safeNavigate = useCallback((url: string) => {
    try {
      // Log navigation attempt
      logNavigationEvent(url, 'direct');
      
      // Direct navigation - most reliable method
      window.location.href = url;
      return true;
    } catch (error) {
      logNavigationError(url, String(error));
      return false;
    }
  }, []);

  // Helper functions for logging
  const logNavigationEvent = (url: string, method: string) => {
    logNavigation(url, method, true);
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      `Navegação para ${url} via ${method}`,
      { url, method }
    );
  };
  
  const logNavigationError = (url: string, errorMsg: string) => {
    logNavigation(url, 'error', false, errorMsg);
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_ERROR,
      LogLevel.ERROR,
      `Falha na navegação para ${url}`,
      { error: errorMsg }
    );
  };
  
  // Função segura para salvar carrinho
  const saveCartToStorage = useCallback((items: CartItem[]) => {
    try {
      // Criar cópia simplificada dos itens do carrinho para evitar problemas de serialização
      const cartItemsSimplified = items.map(item => ({
        panel: {
          id: item.panel.id,
          // Use optional chaining and access the nome property from buildings
          nome: item.panel.buildings?.nome || 'Painel sem nome',
          buildings: item.panel.buildings ? {
            id: item.panel.buildings.id,
            nome: item.panel.buildings.nome,
            imageUrl: item.panel.buildings.imageUrl,
            endereco: item.panel.buildings.endereco,
            bairro: item.panel.buildings.bairro
          } : null,
          modo: item.panel.modo,
          resolucao: item.panel.resolucao
        },
        duration: item.duration
      }));
      
      // Salvar no localStorage
      localStorage.setItem('panelCart', JSON.stringify(cartItemsSimplified));
      
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART, 
        LogLevel.SUCCESS, 
        "Carrinho salvo no localStorage com sucesso", 
        { items: items.length }
      );
      
      return true;
    } catch (storageError) {
      console.error('Erro ao salvar carrinho:', storageError);
      
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART, 
        LogLevel.ERROR, 
        "Erro ao salvar carrinho no localStorage", 
        { error: String(storageError) }
      );
      
      return false;
    }
  }, []);
  
  const handleProceedToCheckout = useCallback(() => {
    // Registrar log de auditoria do início do processo
    logCheckoutEvent(
      CheckoutEvent.AUDIT,
      LogLevel.INFO,
      "Início do processo de checkout",
      { cartItems: cartItems.length, isProcessed: isCheckoutProcessed }
    );
    
    // Verificar se já está processando o checkout para evitar cliques duplos
    if (isCheckoutProcessed) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG,
        LogLevel.WARNING,
        "Tentativa de checkout múltiplo bloqueada"
      );
      return;
    }
    
    setIsCheckoutProcessed(true);
    setIsNavigating(true);
    
    // Registrar início do checkout
    logCheckoutEvent(
      CheckoutEvent.PROCEED_TO_CHECKOUT, 
      LogLevel.INFO, 
      `Iniciando checkout com ${cartItems.length} itens`
    );
    
    try {
      // 1. Verificar se há itens no carrinho
      if (cartItems.length === 0) {
        toast({
          title: "Carrinho vazio",
          description: "Adicione itens ao carrinho para continuar.",
          variant: "destructive",
        });
        
        logCheckoutEvent(
          CheckoutEvent.PROCEED_TO_CHECKOUT, 
          LogLevel.ERROR, 
          "Tentativa de checkout com carrinho vazio"
        );
        
        setIsNavigating(false);
        setIsCheckoutProcessed(false);
        return;
      }
      
      // 2. Salvar carrinho no localStorage de forma segura
      const saveSuccess = saveCartToStorage(cartItems);
      
      if (!saveSuccess) {
        // Tentar uma segunda vez com um pequeno atraso
        setTimeout(() => {
          saveCartToStorage(cartItems);
        }, 100);
      }
      
      // 3. Fechar o carrinho (se estiver aberto)
      setCartOpen(false);
      
      // 4. Navegação simplificada e direta - usando apenas window.location
      // que provou ser o método mais confiável
      logCheckoutEvent(
        CheckoutEvent.NAVIGATE_TO_PLAN, 
        LogLevel.INFO, 
        `Navegação para seleção de plano iniciada`
      );
      
      // Navegação direta - método mais confiável
      safeNavigate('/selecionar-plano');
      
    } catch (error) {
      console.error('Erro durante checkout:', error);
      
      logCheckoutEvent(
        CheckoutEvent.PROCEED_TO_CHECKOUT, 
        LogLevel.ERROR, 
        "Erro durante processo de checkout", 
        { error: String(error) }
      );
      
      // Mostrar mensagem de erro
      toast({
        title: "Erro ao processar checkout",
        description: "Ocorreu um problema ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
      
      // Resetar estados
      setIsNavigating(false);
      setIsCheckoutProcessed(false);
    }
  }, [cartItems, isCheckoutProcessed, setCartOpen, setIsNavigating, saveCartToStorage, safeNavigate, toast]);

  return {
    handleProceedToCheckout,
    isCheckoutProcessed,
    navigationAttempts
  };
};
