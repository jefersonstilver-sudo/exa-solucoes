
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { 
  logCheckoutEvent, 
  LogLevel, 
  CheckoutEvent 
} from '@/services/checkoutDebugService';
import { saveCartToStorage } from '@/services/cartStorageService';
import { useNavigate } from 'react-router-dom';

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
  const { toast } = useToast();
  const [isCheckoutProcessed, setIsCheckoutProcessed] = useState(false);
  const [navigationAttempts, setNavigationAttempts] = useState(0);
  const navigate = useNavigate();
  
  // Reset checkout processed status when cart items change
  useEffect(() => {
    if (isCheckoutProcessed && cartItems.length > 0) {
      setIsCheckoutProcessed(false);
      setNavigationAttempts(0);
    }
  }, [cartItems.length, isCheckoutProcessed]);
  
  const handleProceedToCheckout = useCallback(() => {
    // Log audit of process start
    logCheckoutEvent(
      CheckoutEvent.CHECKOUT_INITIATION,
      LogLevel.INFO,
      `Iniciando checkout com ${cartItems.length} itens`,
      { cartItemCount: cartItems.length }
    );
    
    // Prevent double-clicks with checkout processing flag
    if (isCheckoutProcessed) {
      logCheckoutEvent(
        CheckoutEvent.MULTIPLE_CHECKOUT_ATTEMPT,
        LogLevel.WARNING,
        "Tentativa múltipla de checkout detectada"
      );
      return;
    }
    
    setIsCheckoutProcessed(true);
    setIsNavigating(true);
    
    try {
      // 1. Check if cart has items
      if (cartItems.length === 0) {
        toast({
          title: "Carrinho vazio",
          description: "Adicione itens ao carrinho para continuar.",
          variant: "destructive",
        });
        
        logCheckoutEvent(
          CheckoutEvent.EMPTY_CART_ATTEMPT,
          LogLevel.WARNING,
          "Tentativa de checkout com carrinho vazio"
        );
        
        setIsNavigating(false);
        setIsCheckoutProcessed(false);
        return;
      }
      
      // 2. Save cart to localStorage securely - tentativas múltiplas para garantir persistência
      try {
        localStorage.setItem('panelCart', JSON.stringify(cartItems));
        console.log("Carrinho salvo no localStorage:", cartItems.length, "itens");
        
        // Verificação adicional após o salvamento
        const savedCart = localStorage.getItem('panelCart');
        if (!savedCart) {
          throw new Error("Falha ao verificar carrinho salvo");
        }
        
        // Tenta JSON.parse para confirmar que é válido
        JSON.parse(savedCart);
      } catch (storageError) {
        console.error("Erro ao salvar carrinho:", storageError);
        
        // Tenta novamente com um pequeno delay
        setTimeout(() => {
          try {
            localStorage.setItem('panelCart', JSON.stringify(cartItems));
            console.log("Carrinho salvo na segunda tentativa");
          } catch (retryError) {
            console.error("Falha na segunda tentativa de salvar carrinho:", retryError);
          }
        }, 100);
      }
      
      // 3. Close the cart (if open)
      setCartOpen(false);
      
      // 4. Log navigation attempt
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        "Navegando para seleção de plano"
      );
      
      // 5. Navigate to plan selection
      setTimeout(() => {
        navigate('/selecionar-plano');
        setIsNavigating(false);
      }, 100);
      
    } catch (error) {
      console.error('Erro durante checkout:', error);
      
      logCheckoutEvent(
        CheckoutEvent.CHECKOUT_ERROR,
        LogLevel.ERROR,
        "Erro ao processar checkout",
        { error: String(error) }
      );
      
      // Show error message
      toast({
        title: "Erro ao processar checkout",
        description: "Ocorreu um problema ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
      
      // Reset states
      setIsNavigating(false);
      setIsCheckoutProcessed(false);
    }
  }, [cartItems, isCheckoutProcessed, setCartOpen, setIsNavigating, toast, navigate]);

  return {
    handleProceedToCheckout,
    isCheckoutProcessed,
    navigationAttempts
  };
};
