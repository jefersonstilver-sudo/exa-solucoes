
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';
import { navigateSafely, isCurrentPath } from '@/services/navigationService';
import { logCheckoutInitiation, logEmptyCartAttempt, logCheckoutStart, logCheckoutError, logMultipleCheckoutAttempt } from '@/services/checkoutLogService';

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
    // Log for audit - used for diagnostics
    logCheckoutInitiation(cartItems.length, isCheckoutProcessed);
    
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
    
    // Check if there are items in the cart
    if (cartItems.length === 0) {
      logEmptyCartAttempt();
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
      
      // Save cart to localStorage before navigating
      try {
        localStorage.setItem('panelCart', JSON.stringify(cartItems));
        logCheckoutEvent(
          CheckoutEvent.SAVE_CART, 
          LogLevel.SUCCESS, 
          "Carrinho salvo no localStorage com sucesso", 
          { items: cartItems.length, timestamp: Date.now() }
        );
      } catch (storageError) {
        logCheckoutEvent(
          CheckoutEvent.SAVE_CART, 
          LogLevel.ERROR, 
          "Erro ao salvar carrinho no localStorage", 
          { error: String(storageError), timestamp: Date.now() }
        );
        // Continue even if localStorage fails
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
      
      // If for some reason navigate didn't throw but also didn't work,
      // we'll use a direct navigation after a short delay
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
