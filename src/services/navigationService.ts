
import { logNavigation } from '@/services/navigationAuditService';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

/**
 * Navigate safely to a URL using the most reliable method (window.location).
 * This has proven to be more reliable than React Router's navigate in certain scenarios.
 */
export const navigateSafely = (url: string): boolean => {
  try {
    // Log navigation attempt
    logNavigationEvent(url, 'direct');
    
    // Direct navigation - most reliable method
    window.location.href = url;
    return true;
  } catch (error) {
    logNavigationError(url, String(error));
    return false;
  }
};

/**
 * Log a navigation event with consistent formatting
 */
export const logNavigationEvent = (url: string, method: string) => {
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
