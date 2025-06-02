
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';
import { isCurrentPath } from '@/services/navigationService';

export const useCheckoutNavigation = () => {
  const navigateToCheckout = (navigate: (route: string) => void): boolean => {
    // Don't navigate if already on target page
    if (isCurrentPath('/checkout/plano')) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "User already on plan selection page, not navigating",
        { timestamp: Date.now() }
      );
      return false;
    }

    try {
      // Log navigation attempt
      logCheckoutEvent(
        CheckoutEvent.NAVIGATE_TO_PLAN, 
        LogLevel.INFO, 
        "Navigation attempt to plan selection",
        { timestamp: Date.now() }
      );
      
      // Register navigation and navigate to plan selection using React Router
      logNavigation('/checkout/plano', 'navigate', true);
      
      // Use React Router for navigation
      navigate('/checkout/plano');
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.SUCCESS,
        "Navigation to plan selection completed successfully via React Router",
        { timestamp: Date.now() }
      );

      return true;
    } catch (error) {
      console.error("Navigation error:", error);
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_ERROR,
        LogLevel.ERROR,
        `Navigation failed: ${error}`,
        { error: String(error), timestamp: Date.now() }
      );
      return false;
    }
  };

  return { navigateToCheckout };
};
