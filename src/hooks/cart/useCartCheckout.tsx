
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';
import { navigateSafely, isCurrentPath } from '@/services/navigationService';
import { logCheckoutInitiation, logEmptyCartAttempt, logCheckoutStart, logCheckoutError, logMultipleCheckoutAttempt } from '@/services/checkoutLogService';
import { saveCartToStorage, loadCartFromStorage, CART_STORAGE_KEY } from '@/services/cartStorageService';

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
      `Iniciando checkout [DETALHADO] - Total de itens em estado: ${cartItems.length}`,
      { 
        itemCount: cartItems.length,
        isProcessed: isCheckoutProcessed,
        currentPath: window.location.pathname,
        storageKey: CART_STORAGE_KEY,
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
    
    // VERIFICAÇÃO ADICIONAL - Verificar o localStorage diretamente
    const localStorageCart = localStorage.getItem(CART_STORAGE_KEY);
    console.log("Verificação direta do localStorage antes de checkout:", localStorageCart);
    
    // Verificação de localStorage e do estado - CORRIGIDO: adicionar validação extra
    if (!localStorageCart || localStorageCart === '[]') {
      console.error("ERRO CRÍTICO: localStorage vazio antes do checkout");
      logCheckoutEvent(
        CheckoutEvent.EMPTY_CART_ATTEMPT,
        LogLevel.ERROR,
        `ERRO CRÍTICO: localStorage vazio [${CART_STORAGE_KEY}] antes do checkout`,
        { 
          timestamp: Date.now(),
          storageKey: CART_STORAGE_KEY,
          localStorageValue: localStorageCart
        }
      );
      
      // Tente recarregar do localStorage como último recurso
      try {
        const reloadedCart = loadCartFromStorage();
        if (reloadedCart && reloadedCart.length > 0) {
          console.log("Recuperação de emergência: carrinho recuperado do localStorage", reloadedCart);
          // Continuar com o checkout usando os dados recuperados
        } else {
          toast({
            title: "Carrinho vazio",
            description: "Adicione painéis ao seu carrinho para completar a compra.",
            variant: "destructive",
          });
          return;
        }
      } catch (e) {
        console.error("Falha na recuperação de emergência do carrinho", e);
        toast({
          title: "Carrinho vazio",
          description: "Adicione painéis ao seu carrinho para completar a compra.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // VERIFICAÇÃO DE ESTADO - Verificar se há itens no estado
    if (!cartItems || cartItems.length === 0) {
      // Log detalhado do erro
      logCheckoutEvent(
        CheckoutEvent.EMPTY_CART_ATTEMPT,
        LogLevel.ERROR,
        `ERRO CRÍTICO: Tentativa de checkout com carrinho vazio (estado) [${CART_STORAGE_KEY}]`,
        { 
          timestamp: Date.now(),
          storageKey: CART_STORAGE_KEY,
          cartState: JSON.stringify(cartItems),
          localStorageState: localStorage.getItem(CART_STORAGE_KEY)
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
      
      // VERIFICAÇÃO FINAL - Salvar carrinho com validação rigorosa
      console.log("Salvando carrinho final antes do checkout:", cartItems);
      const saveSuccess = saveCartToStorage(cartItems);
      
      if (!saveSuccess) {
        throw new Error("Falha ao salvar carrinho no localStorage");
      }
      
      // Verificação extra do carrinho após salvar
      const verificationCart = localStorage.getItem(CART_STORAGE_KEY);
      console.log("Verificação após salvar antes do checkout:", verificationCart);
      
      if (!verificationCart || verificationCart === '[]') {
        throw new Error("Falha crítica: carrinho ainda vazio após tentativa de salvar");
      }
      
      // Log navigation
      logCheckoutEvent(
        CheckoutEvent.NAVIGATE_TO_PLAN, 
        LogLevel.INFO, 
        `Tentativa de navegação #1 para seleção de plano [${CART_STORAGE_KEY}]`,
        { timestamp: Date.now(), storageKey: CART_STORAGE_KEY }
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
