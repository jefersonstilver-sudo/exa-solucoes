
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  SUCCESS = 'SUCCESS'
}

export enum CheckoutEvent {
  CART_UPDATED = 'CART_UPDATED',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  PAYMENT_EVENT = 'PAYMENT_EVENT',
  NAVIGATION_EVENT = 'NAVIGATION_EVENT',
  NAVIGATION_ERROR = 'NAVIGATION_ERROR',
  DEBUG_EVENT = 'DEBUG_EVENT',
  AUTH_EVENT = 'AUTH_EVENT',
  USER_ACTION = 'USER_ACTION',
  AUDIT = 'AUDIT',
  PROCEED_TO_CHECKOUT = 'PROCEED_TO_CHECKOUT',
  SAVE_CART = 'SAVE_CART',
  NAVIGATE_TO_PLAN = 'NAVIGATE_TO_PLAN',
  CHECKOUT_INITIATION = 'CHECKOUT_INITIATION',
  EMPTY_CART_ATTEMPT = 'EMPTY_CART_ATTEMPT',
  ADD_TO_CART = 'ADD_TO_CART',
  REMOVE_FROM_CART = 'REMOVE_FROM_CART',
  CLEAR_CART = 'CLEAR_CART',
  UPDATE_CART = 'UPDATE_CART',
  RESTORE_CART = 'RESTORE_CART',
  LOAD_CART = 'LOAD_CART',
  CHECKOUT_ERROR = 'CHECKOUT_ERROR'
}

// Store for logs with automatic cleanup to prevent memory leaks
const checkoutLogs: any[] = [];
const MAX_LOGS = 50; // REDUCED: Limit to prevent infinite growth

// CRITICAL FIX: Implementação de throttling muito mais agressiva
let lastLogTime = 0;
const LOG_THROTTLE_MS = 1000; // INCREASED: Minimum 1 second between logs

// CRITICAL: Map para rastrear logs únicos e evitar duplicatas
const logCache = new Map<string, number>();
const CACHE_DURATION = 5000; // 5 seconds

export const logCheckoutEvent = (
  event: CheckoutEvent,
  level: LogLevel,
  message: string,
  data?: Record<string, any>
) => {
  // CRITICAL: Throttle logs muito mais agressivamente
  const now = Date.now();
  if (now - lastLogTime < LOG_THROTTLE_MS) {
    return; // Skip this log to prevent spam
  }
  
  // CRITICAL: Evitar logs duplicados
  const logKey = `${event}-${level}-${message}`;
  const lastLoggedTime = logCache.get(logKey);
  if (lastLoggedTime && (now - lastLoggedTime) < CACHE_DURATION) {
    return; // Skip duplicate log
  }
  
  lastLogTime = now;
  logCache.set(logKey, now);

  const logEntry = {
    event,
    level,
    message,
    details: data || {},
    timestamp: new Date().toISOString()
  };
  
  // Add to logs array with automatic cleanup
  checkoutLogs.push(logEntry);
  
  // CRITICAL: Prevent memory leaks by limiting log storage
  if (checkoutLogs.length > MAX_LOGS) {
    checkoutLogs.splice(0, checkoutLogs.length - MAX_LOGS);
  }
  
  // CRITICAL: Only log errors and critical success events to console
  if (level === LogLevel.ERROR) {
    console.error(`[${event}] ${message}`, data || {});
  } else if (level === LogLevel.SUCCESS) {
    console.log(`[${event}] ${message}`, data || {});
  }
  
  // REMOVED: All other console logs to reduce noise
};

// Export functions for debug components
export const getAllCheckoutLogs = () => {
  return [...checkoutLogs];
};

export const getCheckoutAuditSummary = () => {
  const summary = {
    totalLogs: checkoutLogs.length,
    errorCount: checkoutLogs.filter(log => log.level === LogLevel.ERROR).length,
    warningCount: checkoutLogs.filter(log => log.level === LogLevel.WARNING).length,
    infoCount: checkoutLogs.filter(log => log.level === LogLevel.INFO).length,
    successCount: checkoutLogs.filter(log => log.level === LogLevel.SUCCESS).length,
    debugCount: checkoutLogs.filter(log => log.level === LogLevel.DEBUG).length,
    lastLogTime: checkoutLogs.length > 0 ? checkoutLogs[checkoutLogs.length - 1].timestamp : null,
    recentErrors: checkoutLogs.filter(log => log.level === LogLevel.ERROR).slice(-3) // REDUCED
  };
  
  return summary;
};

// CRITICAL: Enhanced cleanup function
export const clearCheckoutLogs = () => {
  checkoutLogs.length = 0;
  logCache.clear();
  console.log('%c[SYSTEM] Checkout logs cleared', 'color: #4caf50');
};

// CRITICAL: Auto cleanup old cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, time] of logCache.entries()) {
    if (now - time > CACHE_DURATION) {
      logCache.delete(key);
    }
  }
}, CACHE_DURATION);
