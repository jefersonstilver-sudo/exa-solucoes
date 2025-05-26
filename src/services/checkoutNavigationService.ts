
import { useNavigate } from 'react-router-dom';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';
import { navigateSafely, isCurrentPath } from '@/services/navigationService';

export const useCheckoutNavigation = () => {
  const navigate = useNavigate();

  const navigateToCheckout = (): boolean => {
    // Don't navigate if already on target page
    if (isCurrentPath('/selecionar-plano')) {
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
      
      // Register navigation and navigate to plan selection
      logNavigation('/selecionar-plano', 'navigate', true);
      
      // Use React Router for initial attempt
      navigate('/selecionar-plano');
      
      // Fallback navigation if React Router fails
      setTimeout(() => {
        if (!isCurrentPath('/selecionar-plano')) {
          logCheckoutEvent(
            CheckoutEvent.DEBUG_EVENT,
            LogLevel.WARNING,
            "React Router navigation didn't redirect correctly, using direct navigation",
            { timestamp: Date.now() }
          );
          navigateSafely('/selecionar-plano');
        } else {
          logCheckoutEvent(
            CheckoutEvent.DEBUG_EVENT,
            LogLevel.SUCCESS,
            "Navigation to plan selection completed successfully",
            { timestamp: Date.now() }
          );
        }
      }, 500);

      return true;
    } catch (error) {
      console.error("Navigation error:", error);
      // Last resort - direct navigation
      navigateSafely('/selecionar-plano');
      return false;
    }
  };

  return { navigateToCheckout };
};
