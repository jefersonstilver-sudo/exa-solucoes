
import { format } from 'date-fns';

export enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  DEBUG = 'debug'
}

export enum CheckoutEvent {
  AUDIT = 'audit',
  SAVE_CART = 'save_cart',
  LOAD_CART = 'load_cart',
  ADD_TO_CART = 'add_to_cart',
  REMOVE_FROM_CART = 'remove_from_cart',
  CLEAR_CART = 'clear_cart',
  UPDATE_CART = 'update_cart',
  RESTORE_CART = 'restore_cart',
  PROCEED_TO_CHECKOUT = 'proceed_to_checkout',
  NAVIGATE_TO_PLAN = 'navigate_to_plan',
  NAVIGATION_EVENT = 'navigation_event',
  NAVIGATION_ERROR = 'navigation_error',
  CHECKOUT_INITIATION = 'checkout_initiation',
  CHECKOUT_START = 'checkout_start',
  CHECKOUT_ERROR = 'checkout_error',
  EMPTY_CART_ATTEMPT = 'empty_cart_attempt',
  MULTIPLE_CHECKOUT_ATTEMPT = 'multiple_checkout_attempt',
  PAYMENT_PROCESSING = 'payment_processing',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_ERROR = 'payment_error',
  DEBUG_EVENT = 'debug_event',
  // Add the missing event types
  AUTH_EVENT = 'auth_event',
  PAYMENT_EVENT = 'payment_event',
  USER_ACTION = 'user_action'
}

interface CheckoutLog {
  timestamp: string;
  level: LogLevel;
  event: CheckoutEvent;
  message: string;
  details?: any;
}

// Armazenar logs em localStorage para persistência entre refreshes
const STORAGE_KEY = 'checkout_debug_logs';
const MAX_LOGS = 100;

// Carregar logs existentes
const loadLogs = (): CheckoutLog[] => {
  try {
    const storedLogs = localStorage.getItem(STORAGE_KEY);
    if (storedLogs) {
      const parsedLogs = JSON.parse(storedLogs);
      if (Array.isArray(parsedLogs)) {
        console.log(`Carregados ${parsedLogs.length} logs de checkout do localStorage`);
        return parsedLogs;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar logs de checkout:', error);
  }
  return [];
};

// Array de logs do checkout
let checkoutLogs: CheckoutLog[] = loadLogs();

// Salvar logs no localStorage
const saveLogs = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkoutLogs));
  } catch (error) {
    console.error('Erro ao salvar logs de checkout:', error);
  }
};

// Registrar evento de checkout
export const logCheckoutEvent = (
  event: CheckoutEvent,
  level: LogLevel,
  message: string,
  details?: any
) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss.SSS');
  
  // Criar novo log
  const log: CheckoutLog = {
    timestamp,
    level,
    event,
    message,
    details
  };
  
  // Adicionar ao início do array para que os mais recentes fiquem no topo
  checkoutLogs.unshift(log);
  
  // Limitar o número de logs armazenados
  while (checkoutLogs.length > MAX_LOGS) {
    checkoutLogs.pop();
  }
  
  // Salvar no localStorage
  saveLogs();
  
  // Log no console para diagnóstico imediato
  const levelColors = {
    [LogLevel.INFO]: 'color: #3498db',
    [LogLevel.WARNING]: 'color: #f39c12',
    [LogLevel.ERROR]: 'color: #e74c3c',
    [LogLevel.SUCCESS]: 'color: #2ecc71',
    [LogLevel.DEBUG]: 'color: #9b59b6'
  };
  
  console.log(
    `%c[${log.level.toUpperCase()}] [${log.event}] ${log.message}`,
    levelColors[log.level],
    details || ''
  );
  
  return log;
};

// Obter todos os logs
export const getAllCheckoutLogs = () => {
  return [...checkoutLogs];
};

// Limpar todos os logs
export const clearCheckoutLogs = () => {
  checkoutLogs = [];
  saveLogs();
};

// Função para extrair resumo dos logs de um fluxo de checkout
export const getCheckoutFlowSummary = () => {
  const flowEvents = checkoutLogs.filter(log => 
    log.event === CheckoutEvent.CHECKOUT_INITIATION ||
    log.event === CheckoutEvent.NAVIGATION_EVENT ||
    log.event === CheckoutEvent.CHECKOUT_ERROR ||
    log.event === CheckoutEvent.PAYMENT_PROCESSING ||
    log.event === CheckoutEvent.PAYMENT_SUCCESS ||
    log.event === CheckoutEvent.PAYMENT_ERROR
  );
  
  return flowEvents;
};

// Função para obter resumo de auditoria de checkout
export const getCheckoutAuditSummary = () => {
  // Contabilizar todos os errors recentes
  const recentErrors = checkoutLogs
    .filter(log => log.level === LogLevel.ERROR)
    .slice(0, 5);
  
  // Obter eventos recentes de qualquer tipo
  const recentLogs = checkoutLogs.slice(0, 10);
  
  return {
    totalLogs: checkoutLogs.length,
    errorCount: checkoutLogs.filter(log => log.level === LogLevel.ERROR).length,
    recentErrors,
    recentLogs
  };
};
