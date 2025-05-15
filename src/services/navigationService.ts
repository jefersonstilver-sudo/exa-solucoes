
import { logNavigation } from '@/services/navigationAuditService';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useNavigate } from 'react-router-dom';

type NavigationMethod = 'navigate' | 'direct' | 'history' | 'reload' | 'location' | 'error';

/**
 * Navigate safely to a URL using the most reliable method based on context.
 * Falls back to window.location only when necessary.
 */
export const navigateSafely = (url: string): boolean => {
  try {
    // Log navigation attempt
    logNavigationEvent(url, 'direct');
    
    // Use React Router's navigate function if available via hook
    // This function should be called within a component that has access to React Router context
    
    // Direct navigation - fallback method when React Router isn't accessible
    window.location.href = url;
    return true;
  } catch (error) {
    logNavigationError(url, String(error));
    return false;
  }
};

/**
 * Hook to provide safe navigation functions
 * Must be used within a component that has access to React Router context
 */
export const useSafeNavigation = () => {
  const navigate = useNavigate();
  
  const navigateToRoute = (route: string) => {
    try {
      logNavigationEvent(route, 'navigate');
      navigate(route);
      return true;
    } catch (error) {
      console.error("Erro na navegação React Router:", error);
      logNavigationError(route, String(error));
      
      // Fallback to direct navigation
      try {
        window.location.href = route;
        return true;
      } catch (fallbackError) {
        logNavigationError(route, String(fallbackError));
        return false;
      }
    }
  };
  
  return { navigateToRoute };
};

/**
 * Log a navigation event with consistent formatting
 */
export const logNavigationEvent = (url: string, method: NavigationMethod) => {
  logNavigation(url, method, true);
  logCheckoutEvent(
    CheckoutEvent.NAVIGATION_EVENT,
    LogLevel.INFO,
    `Navegação para ${url} via ${method}`,
    { url, method }
  );
};

/**
 * Log a navigation error with consistent formatting
 */
export const logNavigationError = (url: string, errorMsg: string) => {
  logNavigation(url, 'error', false, errorMsg);
  logCheckoutEvent(
    CheckoutEvent.NAVIGATION_ERROR,
    LogLevel.ERROR,
    `Falha na navegação para ${url}`,
    { error: errorMsg }
  );
};
