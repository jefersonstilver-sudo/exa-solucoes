
import { logNavigation } from '@/services/navigationAuditService';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

type NavigationMethod = 'navigate' | 'direct' | 'history' | 'reload' | 'location' | 'error';

// Navigation cooldown state
let navigationCooldown = false;
let cooldownTimer: NodeJS.Timeout | null = null;

/**
 * Navigate safely to a URL using window.location (for external links only)
 */
export const navigateSafely = (url: string): boolean => {
  try {
    logNavigationEvent(url, 'direct');
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Direct navigation to ${url} initiated`,
      { timestamp: Date.now() }
    );
    
    window.location.href = url;
    return true;
  } catch (error) {
    logNavigationError(url, String(error));
    return false;
  }
};

/**
 * Force navigation to URL using window.location (for external links only)
 */
export const forceNavigate = (url: string): boolean => {
  try {
    logNavigationEvent(url, 'location');
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Force navigation to ${url} via window.location`,
      { timestamp: Date.now() }
    );
    
    window.location.href = url;
    return true;
  } catch (error) {
    logNavigationError(url, String(error));
    return false;
  }
};

/**
 * Hook to provide safe navigation functions
 * USE THIS FOR ALL INTERNAL NAVIGATION
 */
export const useSafeNavigation = () => {
  // This will be implemented by importing useNavigate from react-router-dom
  // in the component that uses this hook
  
  const navigateToRoute = (route: string, navigate: (route: string) => void): boolean => {
    try {
      logNavigationEvent(route, 'navigate');
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        `Navigation to ${route} via React Router initiated`,
        { timestamp: Date.now() }
      );
      
      navigate(route);
      return true;
    } catch (error) {
      console.error("Error in React Router navigation:", error);
      logNavigationError(route, String(error));
      return false;
    }
  };
  
  return { navigateToRoute };
};

/**
 * Reset navigation cooldown state
 */
export const resetNavigationCooldown = (): void => {
  navigationCooldown = false;
  if (cooldownTimer) {
    clearTimeout(cooldownTimer);
    cooldownTimer = null;
  }
  
  logCheckoutEvent(
    CheckoutEvent.DEBUG_EVENT,
    LogLevel.INFO,
    'Navigation cooldown reset',
    { timestamp: Date.now() }
  );
};

/**
 * Log a navigation event with consistent formatting
 */
export const logNavigationEvent = (url: string, method: NavigationMethod) => {
  logNavigation(url, method, true);
  logCheckoutEvent(
    CheckoutEvent.NAVIGATION_EVENT,
    LogLevel.INFO,
    `Navigation to ${url} via ${method}`,
    { url, method, timestamp: Date.now() }
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
    `Navigation failure to ${url}`,
    { error: errorMsg, timestamp: Date.now() }
  );
};

/**
 * Check if the user is currently on a specific URL path
 */
export const isCurrentPath = (path: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === path;
};
