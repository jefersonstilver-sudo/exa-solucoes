
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

// Store for logs
const checkoutLogs: any[] = [];

export const logCheckoutEvent = (
  event: CheckoutEvent,
  level: LogLevel,
  message: string,
  data?: Record<string, any>
) => {
  const color = level === LogLevel.ERROR ? '#e53935' : 
                level === LogLevel.WARNING ? '#ffb300' : 
                level === LogLevel.INFO ? '#3498db' : 
                level === LogLevel.SUCCESS ? '#4caf50' :
                '#607d8b';
  
  const logEntry = {
    event,
    level,
    message,
    details: data || {},
    timestamp: new Date().toISOString()
  };
  
  checkoutLogs.push(logEntry);
  
  console.log(`%c[${level}] [${event}] ${message}`, `color: ${color}`, data || {});
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
    recentErrors: checkoutLogs.filter(log => log.level === LogLevel.ERROR).slice(-5)
  };
  
  return summary;
};
