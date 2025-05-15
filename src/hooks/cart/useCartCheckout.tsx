
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';
import { navigateSafely, forceNavigate } from '@/services/navigationService';
import { logCheckoutInitiation, logEmptyCartAttempt, logCheckoutStart, logCheckoutError, logMultipleCheckoutAttempt } from '@/services/checkoutLogService';

interface UseCartCheckoutProps {
  cartItems: { panel: Panel; duration: number }[];
  setIsNavigating: (isNavigating: boolean) => void;
  setCartOpen: (isOpen: boolean) => void;
}

export const useCartCheckout = ({
  cartItems,
  setIsNavigating,
  setCartOpen
}: UseCartCheckoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCheckoutProcessed, setIsCheckoutProcessed] = useState(false);
  
  const handleProceedToCheckout = () => {
    // Log for audit - used for diagnostics
    logCheckoutInitiation(cartItems.length, isCheckoutProcessed);
    
    // Prevent multiple checkouts
    if (isCheckoutProcessed) {
      logMultipleCheckoutAttempt();
      console.log("Checkout is already being processed, ignoring new attempt");
      return;
    }
    
    // Check if there are items in the cart
    if (cartItems.length === 0) {
      logEmptyCartAttempt();
      toast({
        title: "Empty cart",
        description: "Add panels to your cart to complete the purchase.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Mark checkout as in processing
      setIsCheckoutProcessed(true);
      setIsNavigating(true);
      
      // Close cart
      setCartOpen(false);
      
      // Log checkout start
      logCheckoutStart(cartItems.length);
      
      // Save cart to localStorage before navigating
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      
      // Log navigation
      logCheckoutEvent(
        CheckoutEvent.NAVIGATE_TO_PLAN, 
        LogLevel.INFO, 
        `Navigation to plan selection initiated`
      );
      
      console.log("Starting navigation to /selecionar-plano");
      
      // Register navigation and navigate to plan selection
      logNavigation('/selecionar-plano', 'navigate', true);
      
      // Force navigation first to ensure consistent behavior
      setTimeout(() => {
        console.log("Executing navigation to plan selection");
        navigate('/selecionar-plano');
      }, 100);

    } catch (error) {
      // Record error and notify user
      logCheckoutError(error);
      
      console.error("Error during checkout:", error);
      toast({
        title: "Error",
        description: "An error occurred while processing your order. Please try again.",
        variant: "destructive",
      });
      
      // Reset processing state
      setIsCheckoutProcessed(false);
      setIsNavigating(false);
      
      // Last resort - force navigation
      console.log("Forcing navigation after error");
      forceNavigate('/selecionar-plano');
    }
  };
  
  return {
    handleProceedToCheckout,
    isCheckoutProcessed
  };
};
