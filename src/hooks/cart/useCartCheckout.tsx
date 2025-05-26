
import { CartItem } from '@/types/cart';
import { validateCartForCheckout, saveCartForCheckout } from '@/services/cartValidationService';
import { useCheckoutState } from '@/hooks/cart/useCheckoutState';
import { useUserSession } from '@/hooks/useUserSession';
import { useNavigate } from 'react-router-dom';

interface UseCartCheckoutProps {
  cartItems: CartItem[];
  setIsNavigating: (isNavigating: boolean) => void;
  setCartOpen: (isOpen: boolean) => void;
}

export const useCartCheckout = ({
  cartItems,
  setIsNavigating,
  setCartOpen
}: UseCartCheckoutProps) => {
  const { isLoggedIn } = useUserSession();
  const navigate = useNavigate();
  const {
    isCheckoutProcessed,
    preventMultipleCheckout,
    startCheckoutProcess,
    resetCheckoutProcess,
    handleCheckoutError,
    showEmptyCartToast,
    showAlreadyOnPageToast
  } = useCheckoutState();
  
  const handleProceedToCheckout = () => {
    console.log('🛒 Cart Checkout: Iniciando processo, isLoggedIn:', isLoggedIn);
    
    // Prevent multiple checkouts
    if (!preventMultipleCheckout()) {
      return;
    }
    
    // Validate cart
    const validation = validateCartForCheckout(cartItems);
    if (!validation.isValid) {
      showEmptyCartToast();
      return;
    }

    try {
      // Mark checkout as in processing
      startCheckoutProcess(cartItems.length);
      setIsNavigating(true);
      
      // Close cart
      setCartOpen(false);
      
      // Save cart with validation
      saveCartForCheckout(cartItems);
      
      // Check if already on target page
      if (window.location.pathname === '/selecionar-plano') {
        showAlreadyOnPageToast();
        resetCheckoutProcess();
        setIsNavigating(false);
        return;
      }
      
      // Navigate based on authentication status
      if (!isLoggedIn) {
        console.log('🛒 Cart Checkout: Usuário não logado, redirecionando para login');
        navigate('/login?redirect=/selecionar-plano');
      } else {
        console.log('🛒 Cart Checkout: Usuário logado, indo para seleção de planos');
        navigate('/selecionar-plano');
      }
      
      // Reset processing state after a short delay
      setTimeout(() => {
        resetCheckoutProcess();
        setIsNavigating(false);
      }, 1000);

    } catch (error) {
      console.error('Erro no checkout:', error);
      handleCheckoutError(error);
      setIsNavigating(false);
      
      // Fallback navigation
      if (!isLoggedIn) {
        navigate('/login?redirect=/selecionar-plano');
      } else {
        navigate('/selecionar-plano');
      }
    }
  };
  
  return {
    handleProceedToCheckout,
    isCheckoutProcessed
  };
};
