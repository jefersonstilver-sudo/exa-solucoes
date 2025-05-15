
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';
import { navigateSafely, isCurrentPath } from '@/services/navigationService';
import { logCheckoutInitiation, logEmptyCartAttempt, logCheckoutStart, logCheckoutError, logMultipleCheckoutAttempt } from '@/services/checkoutLogService';
import { saveCartToStorage } from '@/services/cartStorageService';

interface UseCartCheckoutProps {
  cartItems: { panel: Panel; duration: number }[];
  setIsNavigating: (isNavigating: boolean) => void;
  setCartOpen: (isOpen: boolean) => void;
}

export const useCartCheckout = ({
  cartItems,
  setIsNavigating,
  setCartOpen
}: UseCartCheckoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCheckoutProcessed, setIsCheckoutProcessed] = useState(false);
  
  const handleProceedToCheckout = () => {
    // Validação criteriosa do carrinho - log detalhado
    logCheckoutEvent(
      CheckoutEvent.CHECKOUT_INITIATION,
      LogLevel.INFO,
      `Iniciando checkout [DETALHADO] - Total de itens: ${cartItems.length}, IDs: ${cartItems.map(item => item.panel.id).join(', ')}`,
      { 
        itemCount: cartItems.length,
        isProcessed: isCheckoutProcessed,
        items: cartItems.map(item => ({
          panelId: item.panel.id,
          building: item.panel.buildings?.nome || 'Desconhecido',
          duration: item.duration
        }))
      }
    );
    
    // Prevent multiple checkouts
    if (isCheckoutProcessed) {
      logMultipleCheckoutAttempt();
      console.log("Checkout is already being processed, ignoring new attempt");
      toast({
        title: "Processando",
        description: "Seu checkout já está sendo processado, aguarde...",
        variant: "default",
      });
      return;
    }
    
    // VALIDAÇÃO RIGOROSA - Verificar se há itens no carrinho
    if (!cartItems || cartItems.length === 0) {
      // Log detalhado do erro
      logCheckoutEvent(
        CheckoutEvent.EMPTY_CART_ATTEMPT,
        LogLevel.ERROR,
        "ERRO CRÍTICO: Tentativa de checkout com carrinho vazio",
        { 
          timestamp: Date.now(),
          cartState: JSON.stringify(cartItems),
          localStorageState: localStorage.getItem('panelCart')
        }
      );
      
      toast({
        title: "Carrinho vazio",
        description: "Adicione painéis ao seu carrinho para completar a compra.",
        variant: "destructive",
      });
      return;
    }
    
    // Don't navigate if already on the target page
    if (isCurrentPath('/selecionar-plano')) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "User already on plan selection page, not navigating",
        { timestamp: Date.now() }
      );
      toast({
        title: "Você já está na página de seleção de plano",
        description: "Continue o processo de checkout.",
        variant: "default",
      });
      return;
    }
    
    try {
      // Mark checkout as in processing
      setIsCheckoutProcessed(true);
      setIsNavigating(true);
      
      // Close cart
      setCartOpen(false);
      
      // Log checkout start
      logCheckoutStart(cartItems.length);
      
      // Salvar carrinho com método melhorado
      const saveSuccess = saveCartToStorage(cartItems);
      
      if (!saveSuccess) {
        throw new Error("Falha ao salvar carrinho no localStorage");
      }
      
      // Log navigation
      logCheckoutEvent(
        CheckoutEvent.NAVIGATE_TO_PLAN, 
        LogLevel.INFO, 
        `Tentativa de navegação #1 para seleção de plano`,
        { timestamp: Date.now() }
      );
      
      // Register navigation and navigate to plan selection
      logNavigation('/selecionar-plano', 'navigate', true);
      
      // Use navigate for the initial attempt
      navigate('/selecionar-plano');
      
      // Se por algum motivo a navegação não funcionou, usamos uma navegação direta após um pequeno delay
      setTimeout(() => {
        if (!isCurrentPath('/selecionar-plano')) {
          logCheckoutEvent(
            CheckoutEvent.DEBUG_EVENT,
            LogLevel.WARNING,
            "React Router navigation didn't redirect correctly, using direct navigation",
            { timestamp: Date.now() }
          );
          navigateSafely('/selecionar-plano');
        } else {
          // Navigation was successful
          logCheckoutEvent(
            CheckoutEvent.DEBUG_EVENT,
            LogLevel.SUCCESS,
            "Navigation to plan selection completed successfully",
            { timestamp: Date.now() }
          );
        }
        
        // Reset processing state in case we're still on this page
        setIsCheckoutProcessed(false);
        setIsNavigating(false);
      }, 500);

    } catch (error) {
      // Record error and notify user
      logCheckoutError(error);
      
      console.error("Error during checkout:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.",
        variant: "destructive",
      });
      
      // Reset processing state
      setIsCheckoutProcessed(false);
      setIsNavigating(false);
      
      // Last resort - direct navigation
      navigateSafely('/selecionar-plano');
    }
  };
  
  return {
    handleProceedToCheckout,
    isCheckoutProcessed
  };
};
