
import { logNavigation } from '@/services/navigationAuditService';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useNavigate } from 'react-router-dom';

type NavigationMethod = 'navigate' | 'direct' | 'history' | 'reload' | 'location' | 'error';

/**
 * Navigate safely to a URL using React Router
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
 * Force navigation to URL using window.location
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
 */
export const useSafeNavigation = () => {
  const navigate = useNavigate();
  
  const navigateToRoute = (route: string): boolean => {
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
      
      // Fallback to direct navigation
      try {
        return forceNavigate(route);
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
