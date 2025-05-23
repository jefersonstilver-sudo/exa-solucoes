
// We need to add a minimal implementation containing the CheckoutEvent enum

export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export enum CheckoutEvent {
  CART_UPDATED = 'CART_UPDATED',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',  // Added this missing enum
  NAVIGATION_EVENT = 'NAVIGATION_EVENT',
  DEBUG_EVENT = 'DEBUG_EVENT'
}

export const logCheckoutEvent = (
  event: CheckoutEvent,
  level: LogLevel,
  message: string,
  data?: Record<string, any>
) => {
  const color = level === LogLevel.ERROR ? '#e53935' : 
                level === LogLevel.WARNING ? '#ffb300' : 
                level === LogLevel.INFO ? '#3498db' : 
                '#607d8b';
  
  console.log(`%c[${level}] [${event}] ${message}`, `color: ${color}`, data || {});
  
  // In a production environment, you might want to send these logs to a server
  // or analytics platform for monitoring and debugging
};
