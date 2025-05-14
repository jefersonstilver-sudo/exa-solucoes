
/**
 * Serviço para ajudar a debugar o fluxo de checkout
 * Rastreia e registra cada etapa do processo de checkout
 */

// Níveis de log para facilitar a filtragem
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS'
}

// Eventos de checkout que estamos rastreando
export enum CheckoutEvent {
  CART_UPDATED = 'Atualização do carrinho',
  ADD_TO_CART = 'Adição ao carrinho',
  REMOVE_FROM_CART = 'Remoção do carrinho',
  CLEAR_CART = 'Limpeza do carrinho',
  SAVE_CART = 'Salvamento do carrinho',
  RESTORE_CART = 'Restauração do carrinho',
  PROCEED_TO_CHECKOUT = 'Prosseguir para checkout',
  APPLY_COUPON = 'Aplicação de cupom',
  NAVIGATE_TO_PLAN = 'Navegação para seleção de plano',
  LOAD_PLAN = 'Carregamento do plano',
  NAVIGATE_TO_CHECKOUT = 'Navegação para checkout',
  COMPLETE_PURCHASE = 'Finalização da compra',
  NAVIGATION_ERROR = 'Erro de navegação',
  DEBUG = 'Informação de Debug'
}

// Interface para o log de eventos
export interface CheckoutEventLog {
  timestamp: number;
  event: CheckoutEvent;
  level: LogLevel;
  message: string;
  data?: any;
}

// Armazenar logs em memória e localStorage
const MAX_LOGS = 100;
let checkoutLogs: CheckoutEventLog[] = [];

// Salvar logs no localStorage
const saveLogsToStorage = () => {
  try {
    // Limitar o número máximo de logs armazenados
    const logsToSave = checkoutLogs.slice(-MAX_LOGS);
    localStorage.setItem('checkout_debug_logs', JSON.stringify(logsToSave));
  } catch (error) {
    console.error('Falha ao salvar logs no localStorage', error);
  }
};

// Carregar logs do localStorage
const loadLogsFromStorage = (): CheckoutEventLog[] => {
  try {
    const savedLogs = localStorage.getItem('checkout_debug_logs');
    if (savedLogs) {
      const parsedLogs = JSON.parse(savedLogs);
      console.log(`Carregados ${parsedLogs.length} logs de checkout do localStorage`);
      return parsedLogs;
    }
  } catch (error) {
    console.error('Falha ao carregar logs do localStorage', error);
  }
  return [];
};

// Função principal para registro de eventos
export const logCheckoutEvent = (
  event: CheckoutEvent,
  level: LogLevel = LogLevel.INFO,
  message: string,
  data?: any
) => {
  // Criar log de evento
  const log: CheckoutEventLog = {
    timestamp: Date.now(),
    event,
    level,
    message,
    data
  };
  
  // Adicionar ao array de logs
  checkoutLogs.push(log);
  
  // Salvar no localStorage
  saveLogsToStorage();
  
  // Console log com formatação diferente baseada no nível
  let consoleMethod: 'log' | 'info' | 'warn' | 'error' = 'log';
  let style = '';
  
  switch (level) {
    case LogLevel.DEBUG:
      consoleMethod = 'log';
      break;
    case LogLevel.INFO:
      consoleMethod = 'info';
      break;
    case LogLevel.WARNING:
      consoleMethod = 'warn';
      break;
    case LogLevel.ERROR:
      consoleMethod = 'error';
      break;
    case LogLevel.SUCCESS:
      consoleMethod = 'info';
      style = 'color: green';
      break;
  }
  
  // Formatar a mensagem para o console
  const consoleMessage = `[CHECKOUT] [${level}] ${event}: ${message}`;
  
  if (style) {
    console[consoleMethod](`%c${consoleMessage}`, style, data ? data : '');
  } else {
    console[consoleMethod](consoleMessage, data ? data : '');
  }
  
  // Retornar o log para possível uso posterior
  return log;
};

// Inicializar carregando logs do localStorage
try {
  checkoutLogs = loadLogsFromStorage();
} catch (e) {
  console.error('Erro ao inicializar logs de checkout:', e);
}

// Exportar funções e tipos
export { checkoutLogs };
