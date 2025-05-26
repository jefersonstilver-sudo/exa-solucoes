
import { CartItem } from '@/types/cart';
import { validateCartForCheckout, saveCartForCheckout } from '@/services/cartValidationService';
import { useCheckoutNavigation } from '@/services/checkoutNavigationService';
import { useCheckoutState } from '@/hooks/cart/useCheckoutState';
import { isCurrentPath, navigateSafely } from '@/services/navigationService';
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
  const { navigateToCheckout } = useCheckoutNavigation();
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
      
      // FIXED: Navigation based on authentication status
      if (!isLoggedIn) {
        console.log('🛒 Cart Checkout: Usuário não logado, redirecionando para login');
        navigate('/login?redirect=/selecionar-plano');
      } else {
        console.log('🛒 Cart Checkout: Usuário logado, indo para seleção de planos');
        
        // Don't navigate if already on the target page
        if (isCurrentPath('/selecionar-plano')) {
          showAlreadyOnPageToast();
          resetCheckoutProcess();
          setIsNavigating(false);
          return;
        }
        
        navigate('/selecionar-plano');
      }
      
      // Reset processing state after navigation attempt
      setTimeout(() => {
        resetCheckoutProcess();
        setIsNavigating(false);
      }, 500);

    } catch (error) {
      handleCheckoutError(error);
      setIsNavigating(false);
      
      // Last resort - direct navigation based on auth status
      if (!isLoggedIn) {
        navigateSafely('/login?redirect=/selecionar-plano');
      } else {
        navigateSafely('/selecionar-plano');
      }
    }
  };
  
  return {
    handleProceedToCheckout,
    isCheckoutProcessed
  };
};
