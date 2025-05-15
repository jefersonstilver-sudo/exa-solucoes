
import { logNavigation } from '@/services/navigationAuditService';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useNavigate } from 'react-router-dom';

type NavigationMethod = 'navigate' | 'direct' | 'history' | 'reload' | 'location' | 'error';

/**
 * Flag to prevent multiple navigations triggered close together
 * This helps avoid race conditions between React Router and direct navigation
 */
let isNavigationInProgress = false;
const NAVIGATION_COOLDOWN = 800; // ms to prevent duplicate navigations

/**
 * Navigate safely to a URL using the most reliable method based on context.
 * Falls back to window.location only when necessary.
 */
export const navigateSafely = (url: string): boolean => {
  // Don't navigate if another navigation is in progress
  if (isNavigationInProgress) {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.WARNING,
      "Navigation prevented - another navigation already in progress",
      { url, timestamp: Date.now() }
    );
    return false;
  }
  
  try {
    // Set flag to prevent multiple navigations
    isNavigationInProgress = true;
    
    // Log navigation attempt
    logNavigationEvent(url, 'direct');
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Direct navigation to ${url} initiated`,
      { timestamp: Date.now() }
    );
    
    // Direct navigation method
    window.location.href = url;
    
    // Reset flag after navigation cooldown
    setTimeout(() => {
      isNavigationInProgress = false;
    }, NAVIGATION_COOLDOWN);
    
    return true;
  } catch (error) {
    logNavigationError(url, String(error));
    isNavigationInProgress = false;
    return false;
  }
};

/**
 * Force navigation to URL using window.location
 * Used when React Router navigation fails or isn't available
 */
export const forceNavigate = (url: string): boolean => {
  // Don't navigate if another navigation is in progress
  if (isNavigationInProgress) {
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.WARNING,
      "Force navigation prevented - navigation already in progress",
      { url, timestamp: Date.now() }
    );
    return false;
  }
  
  try {
    // Set flag to prevent multiple navigations
    isNavigationInProgress = true;
    
    logNavigationEvent(url, 'location');
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Force navigation to ${url} via window.location`,
      { timestamp: Date.now() }
    );
    
    // Direct navigation
    window.location.href = url;
    
    // Reset flag after navigation cooldown
    setTimeout(() => {
      isNavigationInProgress = false;
    }, NAVIGATION_COOLDOWN);
    
    return true;
  } catch (error) {
    logNavigationError(url, String(error));
    isNavigationInProgress = false;
    return false;
  }
};

/**
 * Hook to provide safe navigation functions
 * Must be used within a component that has access to React Router context
 */
export const useSafeNavigation = () => {
  const navigate = useNavigate();
  
  const navigateToRoute = (route: string): boolean => {
    // Don't navigate if another navigation is in progress
    if (isNavigationInProgress) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.WARNING,
        "Hook navigation prevented - navigation already in progress",
        { route, timestamp: Date.now() }
      );
      return false;
    }
    
    try {
      // Set flag to prevent multiple navigations
      isNavigationInProgress = true;
      
      logNavigationEvent(route, 'navigate');
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        `Navigation to ${route} via React Router initiated`,
        { timestamp: Date.now() }
      );
      
      // Use React Router navigation
      navigate(route);
      
      // Reset flag after navigation cooldown
      setTimeout(() => {
        isNavigationInProgress = false;
      }, NAVIGATION_COOLDOWN);
      
      return true;
    } catch (error) {
      console.error("Error in React Router navigation:", error);
      logNavigationError(route, String(error));
      
      // Only fallback if it's a serious error, not just because we're preventing duplicate navigations
      if (!isNavigationInProgress) {
        // Fallback to direct navigation
        try {
          return forceNavigate(route);
        } catch (fallbackError) {
          logNavigationError(route, String(fallbackError));
          return false;
        }
      }
      
      isNavigationInProgress = false;
      return false;
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
 * Useful to prevent redundant navigations to the same page
 */
export const isCurrentPath = (path: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === path;
};

/**
 * Reset the navigation cooldown manually
 * Used primarily for testing or emergency situations
 */
export const resetNavigationCooldown = () => {
  isNavigationInProgress = false;
};
