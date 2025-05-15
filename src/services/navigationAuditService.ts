
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

// Configuração
const STORAGE_KEY = 'navigation_audit_logs';
const MAX_LOGS = 50;

// Interface para logs de navegação
export interface NavigationLog {
  timestamp: number;
  from: string | null;
  to: string;
  method: 'navigate' | 'direct' | 'history' | 'reload' | 'location' | 'error';
  success: boolean;
  error?: string;
}

// Carregar logs de navegação
const loadNavigationLogs = (): NavigationLog[] => {
  try {
    const storedLogs = localStorage.getItem(STORAGE_KEY);
    return storedLogs ? JSON.parse(storedLogs) : [];
  } catch (error) {
    console.error('Erro ao carregar logs de navegação:', error);
    return [];
  }
};

// Array de logs
let navigationLogs: NavigationLog[] = loadNavigationLogs();

// Salvar logs
const saveNavigationLogs = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(navigationLogs));
  } catch (error) {
    console.error('Erro ao salvar logs de navegação:', error);
  }
};

// Registrar evento de navegação
export const logNavigation = (
  to: string,
  method: 'navigate' | 'direct' | 'history' | 'reload' | 'location' | 'error' = 'navigate',
  success: boolean = true,
  error?: string
) => {
  // Registrar no checkout debug também
  logCheckoutEvent(
    success ? CheckoutEvent.NAVIGATION_EVENT : CheckoutEvent.NAVIGATION_ERROR,
    success ? LogLevel.INFO : LogLevel.ERROR,
    `Navegação para ${to} via ${method} ${success ? 'bem-sucedida' : 'falhou'}`,
    error ? { error } : undefined
  );
  
  const log: NavigationLog = {
    timestamp: Date.now(),
    from: typeof window !== 'undefined' ? window.location.pathname : null,
    to,
    method,
    success,
    error
  };
  
  // Adicionar ao início do array
  navigationLogs.unshift(log);
  
  // Limitar número de logs
  while (navigationLogs.length > MAX_LOGS) {
    navigationLogs.pop();
  }
  
  // Salvar logs
  saveNavigationLogs();
};

// Verificar saúde da navegação
export const checkNavigationHealth = () => {
  // Obter últimos 10 logs
  const recentLogs = navigationLogs.slice(0, 10);
  
  // Contar falhas recentes
  const recentFailures = recentLogs.filter(log => !log.success).length;
  
  // Verificar padrões de navegação problemáticos (ex: muitas tentativas de checkout falhas)
  const checkoutAttempts = recentLogs.filter(
    log => log.to.includes('/checkout') || log.to.includes('/selecionar-plano')
  );
  
  const hasCheckoutIssues = checkoutAttempts.length >= 3 && 
    checkoutAttempts.filter(log => !log.success).length >= 2;
  
  return {
    status: recentFailures > 2 || hasCheckoutIssues ? 'issues' : 'healthy',
    recentFailures,
    hasCheckoutIssues,
    checkoutAttempts: checkoutAttempts.length
  };
};

// Obter todos os logs
export const getAllNavigationLogs = () => {
  return [...navigationLogs];
};

// Limpar logs
export const clearNavigationLogs = () => {
  navigationLogs = [];
  saveNavigationLogs();
};
