export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export enum CheckoutEvent {
  PROCEED_TO_CHECKOUT = 'PROCEED_TO_CHECKOUT',
  NAVIGATION_EVENT = 'NAVIGATION_EVENT',
  DEBUG_EVENT = 'DEBUG_EVENT',
  PAYMENT_EVENT = 'PAYMENT_EVENT'
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
