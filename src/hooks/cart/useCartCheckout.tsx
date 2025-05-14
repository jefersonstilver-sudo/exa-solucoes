
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { 
  logCheckoutInitiation, 
  logEmptyCartAttempt,
  logCheckoutStart,
  logPlanSelectionNavigation,
  logCheckoutError,
  logMultipleCheckoutAttempt
} from '@/services/checkoutLogService';
import { useSafeNavigation } from '@/services/navigationService';
import { saveCartToStorage } from '@/services/cartStorageService';

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
  const { navigateToRoute } = useSafeNavigation();
  
  // Reset checkout processed status when cart items change
  useEffect(() => {
    if (isCheckoutProcessed && cartItems.length > 0) {
      setIsCheckoutProcessed(false);
      setNavigationAttempts(0);
    }
  }, [cartItems.length, isCheckoutProcessed]);
  
  const handleProceedToCheckout = useCallback(() => {
    // Log audit of process start
    logCheckoutInitiation(cartItems.length, isCheckoutProcessed);
    
    // Prevent double-clicks with checkout processing flag
    if (isCheckoutProcessed) {
      logMultipleCheckoutAttempt();
      return;
    }
    
    setIsCheckoutProcessed(true);
    setIsNavigating(true);
    
    // Log checkout start
    logCheckoutStart(cartItems.length);
    
    try {
      // 1. Check if cart has items
      if (cartItems.length === 0) {
        toast({
          title: "Carrinho vazio",
          description: "Adicione itens ao carrinho para continuar.",
          variant: "destructive",
        });
        
        logEmptyCartAttempt();
        
        setIsNavigating(false);
        setIsCheckoutProcessed(false);
        return;
      }
      
      // 2. Save cart to localStorage securely
      const saveSuccess = saveCartToStorage(cartItems);
      
      if (!saveSuccess) {
        // Try a second time with a small delay
        setTimeout(() => {
          saveCartToStorage(cartItems);
        }, 100);
      }
      
      // 3. Close the cart (if open)
      setCartOpen(false);
      
      // 4. Log navigation attempt
      logPlanSelectionNavigation();
      
      // 5. Navigate using React Router (prevents flash)
      navigateToRoute('/selecionar-plano');
      
    } catch (error) {
      console.error('Erro durante checkout:', error);
      
      logCheckoutError(error);
      
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
  }, [cartItems, isCheckoutProcessed, setCartOpen, setIsNavigating, toast, navigateToRoute]);

  return {
    handleProceedToCheckout,
    isCheckoutProcessed,
    navigationAttempts
  };
};
