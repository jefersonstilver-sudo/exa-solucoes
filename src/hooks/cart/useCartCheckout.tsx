
import { CartItem } from '@/types/cart';
import { validateCartForCheckout, saveCartForCheckout } from '@/services/cartValidationService';
import { useCheckoutNavigation } from '@/services/checkoutNavigationService';
import { useCheckoutState } from '@/hooks/cart/useCheckoutState';
import { isCurrentPath, navigateSafely } from '@/services/navigationService';

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
    
    // Don't navigate if already on the target page
    if (isCurrentPath('/selecionar-plano')) {
      showAlreadyOnPageToast();
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
      
      // Navigate to checkout
      const navigationSuccess = navigateToCheckout();
      
      // Reset processing state after navigation attempt
      setTimeout(() => {
        resetCheckoutProcess();
        setIsNavigating(false);
      }, 500);

    } catch (error) {
      handleCheckoutError(error);
      setIsNavigating(false);
      
      // Last resort - direct navigation
      navigateSafely('/selecionar-plano');
    }
  };
  
  return {
    handleProceedToCheckout,
    isCheckoutProcessed
  };
};
