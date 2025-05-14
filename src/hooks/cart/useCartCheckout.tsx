
import { useState, useEffect } from 'react';
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
  const [navigationAttempts, setNavigationAttempts] = useState(0);
  
  // Resetar status de checkout processado ao mudar itens do carrinho
  useEffect(() => {
    if (isCheckoutProcessed && cartItems.length > 0) {
      setIsCheckoutProcessed(false);
      setNavigationAttempts(0);
    }
  }, [cartItems.length, isCheckoutProcessed]);
  
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
      
      // 2. Salvar carrinho no localStorage de forma segura
      try {
        // Criar cópia simplificada dos itens do carrinho para evitar problemas de serialização
        const cartItemsSimplified = cartItems.map(item => ({
          panel: {
            id: item.panel.id,
            // Fix: Use optional chaining and access the nome property from buildings
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
        
        localStorage.setItem('panelCart', JSON.stringify(cartItemsSimplified));
        
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
          { error: String(storageError) }
        );
        
        // Continuar mesmo com erro de armazenamento
      }
      
      // 3. Fechar o carrinho (se estiver aberto)
      setCartOpen(false);
      
      // 4. Estratégia de navegação com múltiplas tentativas
      const attemptNavigation = () => {
        setNavigationAttempts(prev => prev + 1);
        
        logCheckoutEvent(
          CheckoutEvent.NAVIGATE_TO_PLAN, 
          LogLevel.INFO, 
          `Tentativa de navegação #${navigationAttempts + 1} para seleção de plano`
        );
        
        // Primeiro, tentar usar o hook de navegação do React Router
        try {
          navigate('/selecionar-plano', { replace: true });
          
          // Verificar se a navegação funcionou após um pequeno delay
          setTimeout(() => {
            if (window.location.pathname.includes('/paineis-digitais/loja')) {
              // Se ainda estivermos na página atual, usar window.location (fallback)
              window.location.href = '/selecionar-plano';
              
              logCheckoutEvent(
                CheckoutEvent.NAVIGATE_TO_PLAN, 
                LogLevel.WARNING, 
                "Navegação via hook falhou, redirecionando via window.location"
              );
            }
          }, 200);
        } catch (navError) {
          console.error("Erro na navegação:", navError);
          
          logCheckoutEvent(
            CheckoutEvent.NAVIGATION_ERROR, 
            LogLevel.ERROR, 
            "Erro na navegação via hook", 
            { error: String(navError) }
          );
          
          // Tentar navegação direta como último recurso
          window.location.href = '/selecionar-plano';
        }
      };
      
      // Executar a primeira tentativa de navegação
      attemptNavigation();
      
      // Configurar um timer para uma segunda tentativa se necessário
      setTimeout(() => {
        if (window.location.pathname.includes('/paineis-digitais/loja') && navigationAttempts < 2) {
          logCheckoutEvent(
            CheckoutEvent.NAVIGATE_TO_PLAN, 
            LogLevel.WARNING, 
            "Primeira navegação falhou, tentando novamente"
          );
          
          // Forçar navegação direta
          window.location.href = '/selecionar-plano';
        }
      }, 800);
      
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
  };

  return {
    handleProceedToCheckout,
    isCheckoutProcessed,
    navigationAttempts
  };
};
