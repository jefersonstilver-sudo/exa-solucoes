
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
      return;
    }
    
    try {
      // Ensure cart is saved to localStorage
      localStorage.setItem('panelCart', JSON.stringify(cartItems));
      
      // Set a default plan for testing
      localStorage.setItem('selectedPlan', '3');
      
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        "Direct navigation to checkout",
        { url: '/checkout', cartItemsCount: cartItems.length }
      );
      
      // Register navigation
      logNavigation('/checkout', 'direct', true);
      
      // Try React Router navigation first
      try {
        navigate('/checkout');
      } catch (routerError) {
        console.error("Error in direct navigation to checkout:", routerError);
        
        // If React Router fails, try forced navigation
        forceNavigate('/checkout');
      }
    } catch (error) {
      console.error("Error in direct navigation to checkout:", error);
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_ERROR,
        LogLevel.ERROR,
        "Error in direct navigation to checkout",
        { error: String(error) }
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
