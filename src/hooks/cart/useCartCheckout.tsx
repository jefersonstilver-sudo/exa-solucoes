
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

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
  
  const handleProceedToCheckout = () => {
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
      
      // 2. Salvar carrinho no localStorage
      try {
        localStorage.setItem('panelCart', JSON.stringify(cartItems));
        
        logCheckoutEvent(
          CheckoutEvent.SAVE_CART, 
          LogLevel.SUCCESS, 
          "Carrinho salvo no localStorage antes do checkout", 
          { items: cartItems.length }
        );
      } catch (storageError) {
        console.error('Erro ao salvar carrinho:', storageError);
        
        logCheckoutEvent(
          CheckoutEvent.SAVE_CART, 
          LogLevel.ERROR, 
          "Erro ao salvar carrinho no localStorage", 
          { error: storageError }
        );
        
        // Continuar mesmo com erro de armazenamento
      }
      
      // 3. Fechar o carrinho (se estiver aberto)
      setCartOpen(false);
      
      // 4. Tentar navegação com o React Router
      logCheckoutEvent(
        CheckoutEvent.NAVIGATE_TO_PLAN, 
        LogLevel.INFO, 
        "Navegação para seleção de plano: Navigate hook chamado"
      );
      
      // Usar o hook de navegação
      navigate('/selecionar-plano');
      
      // 5. Verificar se a navegação funcionou após um pequeno delay
      setTimeout(() => {
        logCheckoutEvent(
          CheckoutEvent.NAVIGATE_TO_PLAN,
          LogLevel.INFO,
          "Navegação para seleção de plano: Verificando se a navegação ocorreu"
        );
        
        // Se ainda estivermos na página atual, tentar URL direta
        if (window.location.pathname.includes('/paineis-digitais/loja')) {
          logCheckoutEvent(
            CheckoutEvent.NAVIGATE_TO_PLAN, 
            LogLevel.WARNING, 
            "Navegação para seleção de plano: Navegação com hook falhou, tentando com window.location"
          );
          
          // Navegar diretamente usando window.location
          window.location.href = '/selecionar-plano';
          
          logCheckoutEvent(
            CheckoutEvent.NAVIGATE_TO_PLAN, 
            LogLevel.SUCCESS, 
            "Navegação para seleção de plano: Navegando para seleção de plano via window.location"
          );
        }
        
        // Resetar estados após delay maior para garantir que a navegação tenha tempo
        setTimeout(() => {
          setIsNavigating(false);
          setIsCheckoutProcessed(false);
        }, 1000);
      }, 300);
      
    } catch (error) {
      console.error('Erro durante checkout:', error);
      
      logCheckoutEvent(
        CheckoutEvent.PROCEED_TO_CHECKOUT, 
        LogLevel.ERROR, 
        "Erro durante processo de checkout", 
        { error }
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
  };

  return {
    handleProceedToCheckout
  };
};
