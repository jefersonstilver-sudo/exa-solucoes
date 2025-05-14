
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
  NAVIGATION_EVENT = 'Evento de navegação',
  DEBUG = 'Informação de Debug',
  AUDIT = 'Auditoria do sistema'
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

// Função para serializar logs de forma segura (evita erros de circular reference)
const safeStringify = (obj: any): string => {
  try {
    // Substitui referências circulares e DOM elements com versões seguras
    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key: string, value: any) => {
        // Ignora elementos DOM que causam erros de serialização
        if (value instanceof Node) return '[DOM Element]';
        if (value instanceof Event) return '[DOM Event]';
        if (typeof value === 'function') return '[Function]';
        
        // Ignora completamente objetos window e document
        if (value === window) return '[Window]';
        if (value === document) return '[Document]';
        
        // Detecta referências circulares para objetos normais
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        return value;
      };
    };
    
    return JSON.stringify(obj, getCircularReplacer());
  } catch (error) {
    console.error('Erro ao serializar objeto:', error);
    return JSON.stringify({ error: 'Erro ao serializar objeto', simpleData: typeof obj });
  }
};

// Salvar logs no localStorage
const saveLogsToStorage = () => {
  try {
    // Limitar o número máximo de logs armazenados
    const logsToSave = checkoutLogs.slice(-MAX_LOGS);
    
    // Usar a função de serialização segura
    localStorage.setItem('checkout_debug_logs', safeStringify(logsToSave));
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
  // Processar dados antes de logar para evitar circular references
  let safeData = data;
  if (data) {
    // Se for um objeto complexo, tente uma serialização segura
    try {
      if (typeof data === 'object') {
        // Criar uma versão simplificada do objeto apenas com propriedades seguras
        safeData = JSON.parse(safeStringify(data));
      }
    } catch (e) {
      safeData = { error: 'Dados não serializáveis', type: typeof data };
    }
  }
  
  // Criar log de evento
  const log: CheckoutEventLog = {
    timestamp: Date.now(),
    event,
    level,
    message,
    data: safeData
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
    console[consoleMethod](`%c${consoleMessage}`, style, safeData ? safeData : '');
  } else {
    console[consoleMethod](consoleMessage, safeData ? safeData : '');
  }
  
  // Retornar o log para possível uso posterior
  return log;
};

// Função para obter um resumo dos logs para auditoria
export const getCheckoutAuditSummary = (): any => {
  const eventCounts: Record<string, number> = {};
  const errorEvents: CheckoutEventLog[] = [];
  
  // Analisar logs
  checkoutLogs.forEach(log => {
    // Contar ocorrências de eventos
    if (!eventCounts[log.event]) {
      eventCounts[log.event] = 0;
    }
    eventCounts[log.event]++;
    
    // Coletar logs de erro
    if (log.level === LogLevel.ERROR) {
      errorEvents.push(log);
    }
  });
  
  // Calcular métricas
  return {
    totalLogs: checkoutLogs.length,
    eventCounts,
    errorCount: errorEvents.length,
    recentErrors: errorEvents.slice(-5),
    recentLogs: checkoutLogs.slice(-10)
  };
};

// Inicializar carregando logs do localStorage
try {
  checkoutLogs = loadLogsFromStorage();
} catch (e) {
  console.error('Erro ao inicializar logs de checkout:', e);
}

// Exportar funções e tipos
export { checkoutLogs };

