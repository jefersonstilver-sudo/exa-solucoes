
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';
import { navigateSafely, forceNavigate } from '@/services/navigationService';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const useDebugCheckout = (cartItems: CartItem[]) => {
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const navigate = useNavigate();
  
  /**
   * Function to navigate directly to checkout without going through normal flows
   */
  const directGoToCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Log for tracking and diagnostics
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      "Direct checkout button clicked",
      { cartItemsCount: cartItems.length }
    );
    
    if (cartItems.length === 0) {
      logCheckoutEvent(
        CheckoutEvent.CHECKOUT_ERROR,
        LogLevel.ERROR,
        "Attempt to direct checkout with empty cart"
      );
      console.log("Direct checkout prevented: cart is empty");
      return;
    }
    
    try {
      console.log("Starting direct checkout process");
      
      // Ensure cart is saved to localStorage
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      console.log("Cart saved to localStorage with", cartItems.length, "items");
      
      // Set a default plan for testing
      localStorage.setItem('selectedPlan', '3');
      console.log("Default plan (3) saved to localStorage");
      
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        "Direct navigation to checkout",
        { url: '/checkout', cartItemsCount: cartItems.length }
      );
      
      // Register navigation
      logNavigation('/checkout', 'direct', true);
      
      console.log("Executing navigation to /checkout");
      
      // First attempt with React Router
      navigate('/checkout');
      
      // Backup with setTimeout for safety
      setTimeout(() => {
        console.log("Checking if navigation worked");
        if (window.location.pathname !== '/checkout') {
          console.log("Navigation failed, forcing navigation");
          forceNavigate('/checkout');
        }
      }, 300);
    } catch (error) {
      console.error("Error in direct navigation to checkout:", error);
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_ERROR,
        LogLevel.ERROR,
        "Error in direct navigation to checkout",
        { error: String(error) }
      );
      
      // Last resort fallback to window.location
      console.log("Error occurred, forcing navigation to /checkout");
      navigateSafely('/checkout');
    }
  };
  
  return {
    debugModalOpen,
    setDebugModalOpen,
    directGoToCheckout
  };
};
