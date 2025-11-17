
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
    if (isCurrentPath('/selecionar-plano')) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "User already on plan selection page, not navigating",
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
        "Direct navigation to plan selection",
        { url: '/selecionar-plano', cartItemsCount: cartItems.length, timestamp: Date.now() }
      );
      
      // Register navigation
      logNavigation('/selecionar-plano', 'direct', true);
      
      console.log("Executing direct navigation to /selecionar-plano");
      
      // First attempt with React Router
      navigate('/selecionar-plano');
      
      // Backup check in case React Router navigation didn't work
      setTimeout(() => {
        if (!isCurrentPath('/selecionar-plano')) {
          logCheckoutEvent(
            CheckoutEvent.DEBUG_EVENT,
            LogLevel.WARNING,
            "React Router navigation didn't reach plan selection, using direct navigation",
            { timestamp: Date.now() }
          );
          navigateSafely('/selecionar-plano');
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
      navigateSafely('/selecionar-plano');
    }
  };
  
  return {
    debugModalOpen,
    setDebugModalOpen,
    directGoToCheckout
  };
};
