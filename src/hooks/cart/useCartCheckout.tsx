
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CartItem } from './useCartState';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast as sonnerToast } from 'sonner';

interface UseCartCheckoutProps {
  cartItems: CartItem[];
  setIsNavigating: React.Dispatch<React.SetStateAction<boolean>>;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useCartCheckout = ({
  cartItems,
  setIsNavigating,
  setCartOpen
}: UseCartCheckoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Procedimento de checkout para redirecionar para seleção de plano
  const handleProceedToCheckout = useCallback(() => {
    console.log("Iniciando processo de checkout com", cartItems.length, "itens");
    logCheckoutEvent(
      CheckoutEvent.PROCEED_TO_CHECKOUT, 
      LogLevel.INFO, 
      `Iniciando processo de checkout no hook com ${cartItems.length} itens`
    );
    
    if (cartItems.length === 0) {
      logCheckoutEvent(
        CheckoutEvent.PROCEED_TO_CHECKOUT, 
        LogLevel.ERROR, 
        "Tentativa de checkout com carrinho vazio"
      );
      
      toast({
        title: "Carrinho vazio",
        description: "Adicione painéis ao seu carrinho para finalizar a compra",
        variant: "destructive"
      });
      return;
    }
    
    // IMPORTANTE: Armazenar o carrinho em localStorage antes de navegar
    try {
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      console.log("Carrinho salvo para checkout:", cartItems.length, "itens");
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART, 
        LogLevel.SUCCESS, 
        `Carrinho salvo para checkout: ${cartItems.length} itens`,
        { cartItems }
      );
      
      // Show feedback to user
      sonnerToast.success("Carrinho salvo com sucesso!");
    } catch (e) {
      console.error('Falha ao salvar o carrinho para checkout', e);
      logCheckoutEvent(
        CheckoutEvent.SAVE_CART, 
        LogLevel.ERROR, 
        "Falha ao salvar o carrinho para checkout",
        { error: e }
      );
      
      toast({
        title: "Erro ao processar o carrinho",
        description: "Ocorreu um erro ao finalizar a compra. Tente novamente.",
        variant: "destructive"
      });
      return;
    }
    
    // Force handle browser navigation directly
    const goToCheckout = () => {
      // Força a navegação diretamente usando window.location
      logCheckoutEvent(
        CheckoutEvent.NAVIGATE_TO_PLAN, 
        LogLevel.SUCCESS, 
        "Navegando para seleção de plano via window.location"
      );
      window.location.href = '/selecionar-plano';
    };
    
    // Marca que estamos navegando para evitar problemas com o drawer
    setIsNavigating(true);
    
    // Fecha o drawer antes da navegação
    setCartOpen(false);
    
    // Primeiro log de tentativa
    logCheckoutEvent(
      CheckoutEvent.NAVIGATE_TO_PLAN, 
      LogLevel.INFO, 
      "Navegando para seleção de plano (primeira tentativa)"
    );
    
    // Atraso maior para garantir que o estado foi atualizado antes da navegação
    setTimeout(() => {
      try {
        // Tenta navegar usando o hook
        navigate('/selecionar-plano');
        
        // Segundo log de verificação
        logCheckoutEvent(
          CheckoutEvent.NAVIGATE_TO_PLAN, 
          LogLevel.INFO, 
          "Navigate hook chamado, verificando se a navegação ocorreu"
        );
        
        // Adiciona um fallback para garantir a navegação
        setTimeout(() => {
          // Verifica se ainda estamos na mesma página
          if (window.location.pathname.includes('/paineis-digitais/loja')) {
            logCheckoutEvent(
              CheckoutEvent.NAVIGATE_TO_PLAN, 
              LogLevel.WARNING, 
              "Navegação com hook falhou, tentando com window.location"
            );
            // Se ainda estivermos na loja, força a navegação
            goToCheckout();
          }
        }, 500);
      } catch (navigateError) {
        console.error("Erro ao navegar:", navigateError);
        logCheckoutEvent(
          CheckoutEvent.NAVIGATE_TO_PLAN, 
          LogLevel.ERROR, 
          `Erro ao navegar: ${navigateError}`,
          { error: navigateError }
        );
        
        // Forçar navegação em caso de erro
        goToCheckout();
      }
    }, 200); // Aumento do delay para 200ms
  }, [cartItems, navigate, toast, setIsNavigating, setCartOpen]);

  return {
    handleProceedToCheckout
  };
};
