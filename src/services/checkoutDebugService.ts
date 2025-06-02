
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  SUCCESS = 'SUCCESS'
}

export enum CheckoutEvent {
  PROCEED_TO_CHECKOUT = 'PROCEED_TO_CHECKOUT',
  NAVIGATION_EVENT = 'NAVIGATION_EVENT',
  DEBUG_EVENT = 'DEBUG_EVENT',
  PAYMENT_EVENT = 'PAYMENT_EVENT',
  AUTH_EVENT = 'AUTH_EVENT',
  USER_ACTION = 'USER_ACTION',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  ADD_TO_CART = 'ADD_TO_CART',
  REMOVE_FROM_CART = 'REMOVE_FROM_CART',
  CLEAR_CART = 'CLEAR_CART',
  UPDATE_CART = 'UPDATE_CART',
  RESTORE_CART = 'RESTORE_CART',
  NAVIGATE_TO_PLAN = 'NAVIGATE_TO_PLAN',
  CHECKOUT_INITIATION = 'CHECKOUT_INITIATION',
  EMPTY_CART_ATTEMPT = 'EMPTY_CART_ATTEMPT',
  CHECKOUT_ERROR = 'CHECKOUT_ERROR',
  NAVIGATION_ERROR = 'NAVIGATION_ERROR',
  AUDIT = 'AUDIT'
}

export const logCheckoutEvent = (
  event: CheckoutEvent,
  level: LogLevel,
  message: string,
  data?: any
) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    level,
    message,
    data
  };
  
  console.log(`[${level}] [${event}] ${message}`, data || '');
  
  // Optionally store in localStorage for debugging
  try {
    const logs = JSON.parse(localStorage.getItem('checkoutLogs') || '[]');
    logs.push(logEntry);
    // Keep only last 50 logs
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50);
    }
    localStorage.setItem('checkoutLogs', JSON.stringify(logs));
  } catch (error) {
    console.error('Error storing checkout log:', error);
  }
};

// Additional exported functions that are missing
export const getAllCheckoutLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('checkoutLogs') || '[]');
  } catch (error) {
    console.error('Error getting checkout logs:', error);
    return [];
  }
};

export const getCheckoutAuditSummary = () => {
  const logs = getAllCheckoutLogs();
  const errorLogs = logs.filter((log: any) => log.level === LogLevel.ERROR);
  
  return {
    totalLogs: logs.length,
    errorCount: errorLogs.length,
    recentErrors: errorLogs.slice(-5) // Last 5 errors
  };
};

export const clearCheckoutLogs = () => {
  try {
    localStorage.removeItem('checkoutLogs');
  } catch (error) {
    console.error('Error clearing checkout logs:', error);
  }
};
