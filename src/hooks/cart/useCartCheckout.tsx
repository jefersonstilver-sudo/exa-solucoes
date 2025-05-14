
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
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
  
  // Função de navegação segura (memoizada)
  const safeNavigate = useCallback((url: string, method: 'hook' | 'location' | 'direct') => {
    try {
      // Registrar tentativa para auditoria
      logNavigation(url, method, true);
      
      if (method === 'hook') {
        navigate(url, { replace: true });
      } else if (method === 'direct') {
        window.location.href = url;
      } else if (method === 'location') {
        // Simulação de navegação direta que preserva o histórico
        window.location.href = url;
      }
      return true;
    } catch (error) {
      logNavigation(url, method, false, String(error));
      console.error(`Erro ao navegar para ${url} via ${method}:`, error);
      return false;
    }
  }, [navigate]);
  
  // Função segura para salvar carrinho
  const saveCartToStorage = useCallback((items: CartItem[]) => {
    try {
      // Criar cópia simplificada dos itens do carrinho para evitar problemas de serialização
      const cartItemsSimplified = items.map(item => ({
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
      { cartItems: cartItems.length, isProcessed: isCheckoutProcessed, attempts: navigationAttempts }
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
      
      // 4. Estratégia robusta de navegação com múltiplas tentativas
      const navigateToPlanSelection = () => {
        setNavigationAttempts(prev => prev + 1);
        const attemptNumber = navigationAttempts + 1;
        
        logCheckoutEvent(
          CheckoutEvent.NAVIGATE_TO_PLAN, 
          LogLevel.INFO, 
          `Tentativa de navegação #${attemptNumber} para seleção de plano`,
          { route: '/selecionar-plano' }
        );
        
        // Primeiro método: react-router hook
        if (attemptNumber === 1) {
          if (safeNavigate('/selecionar-plano', 'hook')) {
            // Verificar se a navegação funcionou após um pequeno delay
            setTimeout(() => {
              const currentPath = window.location.pathname;
              if (currentPath.includes('/paineis-digitais/loja')) {
                logCheckoutEvent(
                  CheckoutEvent.NAVIGATION_ERROR,
                  LogLevel.WARNING,
                  "Navegação via hook falhou, usando window.location"
                );
                
                // Segundo método: window.location
                safeNavigate('/selecionar-plano', 'location');
              }
            }, 300);
          } else {
            // Fallback imediato se o hook falhar
            safeNavigate('/selecionar-plano', 'direct');
          }
        } 
        // Segunda tentativa com método mais direto
        else if (attemptNumber === 2) {
          safeNavigate('/selecionar-plano', 'direct');
        }
        // Terceira tentativa com diálogo de fallback
        else if (attemptNumber === 3) {
          // Mostrar mensagem de alerta
          toast({
            title: "Dificuldade na navegação",
            description: "Redirecionando para seleção de plano...",
            variant: "default",
          });
          
          // Usar uma abordagem mais forte para redirecionar
          setTimeout(() => {
            document.location.href = '/selecionar-plano';
          }, 500);
        }
      };
      
      // Executar a primeira tentativa de navegação
      navigateToPlanSelection();
      
      // Configurar um timer para uma segunda tentativa se necessário
      setTimeout(() => {
        if (window.location.pathname.includes('/paineis-digitais/loja') && navigationAttempts < 2) {
          logCheckoutEvent(
            CheckoutEvent.NAVIGATE_TO_PLAN, 
            LogLevel.WARNING, 
            "Primeira navegação falhou, tentando novamente"
          );
          
          // Disparar uma mensagem visual para o usuário
          toast.info("Redirecionando para seleção de plano...");
          
          // Forçar navegação direta
          navigateToPlanSelection();
        }
      }, 800);
      
      // Configurar um timer para uma terceira tentativa final
      setTimeout(() => {
        if (window.location.pathname.includes('/paineis-digitais/loja') && navigationAttempts < 3) {
          logCheckoutEvent(
            CheckoutEvent.NAVIGATION_ERROR, 
            LogLevel.ERROR, 
            "Múltiplas tentativas de navegação falharam, tentativa final"
          );
          
          toast.error("Dificuldade ao navegar, tentativa final...");
          navigateToPlanSelection();
        }
      }, 1500);
      
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
  }, [cartItems, isCheckoutProcessed, navigationAttempts, setCartOpen, setIsNavigating, saveCartToStorage, safeNavigate, toast]);

  return {
    handleProceedToCheckout,
    isCheckoutProcessed,
    navigationAttempts
  };
};

