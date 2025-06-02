
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { isCartEmpty, loadCartFromStorage, CART_STORAGE_KEY } from '@/services/cartStorageService';

export const useCartVerification = (isAuthVerified: boolean) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasCart, setHasCart] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Verificação de carrinho
  useEffect(() => {
    // Só executar quando a autenticação estiver verificada
    if (!isAuthVerified) return;
    
    const verifyCart = async () => {
      try {
        console.log("PlanSelection: Verificando carrinho no localStorage");
        
        // Verificação direta do localStorage
        const rawCart = localStorage.getItem(CART_STORAGE_KEY);
        console.log(`PlanSelection: Valor direto do localStorage [${CART_STORAGE_KEY}]:`, rawCart);
        
        // Verificação robusta do carrinho
        if (isCartEmpty()) {
          console.log(`PlanSelection: Carrinho vazio ou inválido detectado [${CART_STORAGE_KEY}]`);
          
          logCheckoutEvent(
            CheckoutEvent.LOAD_CART, 
            LogLevel.WARNING, 
            `ALERTA: Carrinho vazio ou inválido detectado [${CART_STORAGE_KEY}] na página de seleção de plano - redirecionando`, 
            { 
              timestamp: Date.now(),
              storageKey: CART_STORAGE_KEY,
              localStorageValue: rawCart
            }
          );
          
          toast({
            title: "Carrinho vazio",
            description: "Adicione itens ao carrinho antes de selecionar um plano.",
            variant: "destructive"
          });
          
          // Redirecionamento imediato para a loja
          navigate('/paineis-digitais/loja');
          return;
        }
        
        // Carregar carrinho com função aprimorada
        const parsedCart = loadCartFromStorage();
        console.log("PlanSelection: Carrinho carregado:", parsedCart);
        
        // Verificar explicitamente se temos itens no carrinho
        if (parsedCart.length === 0) {
          logCheckoutEvent(
            CheckoutEvent.LOAD_CART, 
            LogLevel.WARNING, 
            `Carrinho vazio após carregamento [${CART_STORAGE_KEY}] - redirecionando para loja`, 
            { timestamp: Date.now(), storageKey: CART_STORAGE_KEY }
          );
          
          toast({
            title: "Carrinho vazio",
            description: "Adicione itens ao carrinho antes de selecionar um plano.",
            variant: "destructive"
          });
          
          navigate('/paineis-digitais/loja');
          return;
        }
        
        // Se chegamos aqui, temos um carrinho válido com itens
        logCheckoutEvent(
          CheckoutEvent.LOAD_CART, 
          LogLevel.SUCCESS, 
          `Carrinho carregado com sucesso [${CART_STORAGE_KEY}] na página de seleção de plano: ${parsedCart.length} itens`, 
          { 
            itemCount: parsedCart.length, 
            timestamp: Date.now(),
            storageKey: CART_STORAGE_KEY
          }
        );
        
        setHasCart(true);
        
      } catch (e) {
        // Tratamento robusto de erro
        console.error(`Erro crítico ao carregar carrinho [${CART_STORAGE_KEY}]:`, e);
        
        logCheckoutEvent(
          CheckoutEvent.LOAD_CART, 
          LogLevel.ERROR, 
          `ERRO CRÍTICO ao carregar carrinho [${CART_STORAGE_KEY}] na página de seleção de plano`, 
          { error: String(e), timestamp: Date.now(), storageKey: CART_STORAGE_KEY }
        );
        
        toast({
          title: "Erro ao carregar carrinho",
          description: "Ocorreu um erro ao carregar seu carrinho. Tente novamente.",
          variant: "destructive"
        });
        
        navigate('/paineis-digitais/loja');
        return;
      } finally {
        setInitialLoadDone(true);
      }
    };
    
    verifyCart();
  }, [isAuthVerified, navigate, toast]);

  return {
    hasCart,
    setHasCart,
    initialLoadDone
  };
};
