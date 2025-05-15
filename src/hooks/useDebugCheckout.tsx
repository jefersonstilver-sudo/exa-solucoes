
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';
import { navigateSafely, isCurrentPath } from '@/services/navigationService';

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
      { cartItemsCount: cartItems.length, timestamp: Date.now() }
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
    
    // Don't navigate if already on the target page
    if (isCurrentPath('/checkout')) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "User already on checkout page, not navigating",
        { timestamp: Date.now() }
      );
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
        { url: '/checkout', cartItemsCount: cartItems.length, timestamp: Date.now() }
      );
      
      // Register navigation
      logNavigation('/checkout', 'direct', true);
      
      console.log("Executing direct navigation to /checkout");
      
      // First attempt with React Router
      navigate('/checkout');
      
      // Backup check in case React Router navigation didn't work
      setTimeout(() => {
        if (!isCurrentPath('/checkout')) {
          logCheckoutEvent(
            CheckoutEvent.DEBUG_EVENT,
            LogLevel.WARNING,
            "React Router navigation didn't reach checkout, using direct navigation",
            { timestamp: Date.now() }
          );
          navigateSafely('/checkout');
        }
      }, 300);
    } catch (error) {
      console.error("Error in direct navigation to checkout:", error);
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_ERROR,
        LogLevel.ERROR,
        "Error in direct navigation to checkout",
        { error: String(error), timestamp: Date.now() }
      );
      
      // Last resort fallback to window.location
      navigateSafely('/checkout');
    }
  };
  
  return {
    debugModalOpen,
    setDebugModalOpen,
    directGoToCheckout
  };
};
