
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';
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
    // Log para auditoria - usado para diagnóstico
    logCheckoutInitiation(cartItems.length, isCheckoutProcessed);
    
    // Evitar múltiplos checkouts
    if (isCheckoutProcessed) {
      logMultipleCheckoutAttempt();
      console.log("Checkout já está sendo processado, ignorando nova tentativa");
      return;
    }
    
    // Verificar se existem itens no carrinho
    if (cartItems.length === 0) {
      logEmptyCartAttempt();
      toast({
        title: "Carrinho vazio",
        description: "Adicione painéis ao seu carrinho para finalizar a compra.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Marcar checkout como em processamento
      setIsCheckoutProcessed(true);
      setIsNavigating(true);
      
      // Fechar carrinho
      setCartOpen(false);
      
      // Log de início do checkout
      logCheckoutStart(cartItems.length);
      
      // Salva carrinho no localStorage antes de navegar
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      
      // Log de navegação
      logCheckoutEvent(
        CheckoutEvent.NAVIGATE_TO_PLAN, 
        LogLevel.INFO, 
        `Navegação para seleção de plano iniciada`
      );
      
      // Registrar navegação e navegar para seleção de plano
      logNavigation('/selecionar-plano', 'navigate', true);
      navigate('/selecionar-plano');
    } catch (error) {
      // Registrar erro e notificar usuário
      logCheckoutError(error);
      
      console.error("Erro durante checkout:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.",
        variant: "destructive",
      });
      
      // Resetar estado de processamento
      setIsCheckoutProcessed(false);
      setIsNavigating(false);
    }
  };
  
  return {
    handleProceedToCheckout,
    isCheckoutProcessed
  };
};
