
/**
 * Serviço para ajudar a debugar o fluxo de checkout
 * Rastreia e registra cada etapa do processo de checkout
 */

// Níveis de log
export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

// Eventos de checkout para rastrear
export enum CheckoutEvent {
  ADD_TO_CART = 'Adição ao carrinho',
  REMOVE_FROM_CART = 'Remoção do carrinho',
  PROCEED_TO_CHECKOUT = 'Início do checkout',
  SAVE_CART = 'Salvamento do carrinho',
  LOAD_CART = 'Carregamento do carrinho',
  NAVIGATE_TO_PLAN = 'Navegação para seleção de plano',
  SELECT_PLAN = 'Seleção de plano',
  SAVE_PLAN = 'Salvamento do plano',
  LOAD_PLAN = 'Carregamento do plano',
  NAVIGATE_TO_CHECKOUT = 'Navegação para checkout',
  COMPLETE_PURCHASE = 'Finalização da compra'
}

// Interface para o log de eventos
interface CheckoutLog {
  timestamp: Date;
  event: CheckoutEvent;
  level: LogLevel;
  message: string;
  data?: any;
}

// Armazena logs em memória
const logs: CheckoutLog[] = [];

// Exporta função para registrar eventos
export const logCheckoutEvent = (
  event: CheckoutEvent,
  level: LogLevel = LogLevel.INFO,
  message: string,
  data?: any
) => {
  const log: CheckoutLog = {
    timestamp: new Date(),
    event,
    level,
    message,
    data
  };
  
  logs.push(log);
  
  // Format console log with colors
  const formatMessage = `[CHECKOUT] [${level}] ${event}: ${message}`;
  
  switch (level) {
    case LogLevel.ERROR:
      console.error(formatMessage, data || '');
      break;
    case LogLevel.WARNING:
      console.warn(formatMessage, data || '');
      break;
    case LogLevel.SUCCESS:
      console.log(`%c${formatMessage}`, 'color: green', data || '');
      break;
    default:
      console.log(formatMessage, data || '');
  }
  
  return log;
};

// Exporta função para obter todos os logs
export const getCheckoutLogs = () => {
  return [...logs];
};

// Exporta função para limpar todos os logs
export const clearCheckoutLogs = () => {
  logs.length = 0;
};

export default {
  logCheckoutEvent,
  getCheckoutLogs,
  clearCheckoutLogs,
  LogLevel,
  CheckoutEvent
};
