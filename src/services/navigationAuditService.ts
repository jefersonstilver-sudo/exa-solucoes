
// Serviço de auditoria de navegação para depurar problemas de redirecionamento
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

// Interface para o registro de navegação
interface NavigationLog {
  timestamp: number;
  route: string;
  method: string;
  success: boolean;
  error?: string;
  info?: any;
}

// Armazenar logs de navegação
const navigationLogs: NavigationLog[] = [];
const MAX_LOGS = 50;

// Função para registrar tentativas de navegação
export const logNavigation = (
  route: string, 
  method: string, 
  success: boolean,
  error?: string,
  info?: any
) => {
  // Criar novo log de navegação
  const log: NavigationLog = {
    timestamp: Date.now(),
    route,
    method,
    success,
    error,
    info
  };
  
  // Adicionar ao array de logs
  navigationLogs.push(log);
  
  // Limitar o número de logs armazenados
  while (navigationLogs.length > MAX_LOGS) {
    navigationLogs.shift();
  }
  
  // Registrar no sistema de logs de checkout
  logCheckoutEvent(
    CheckoutEvent.NAVIGATION_EVENT,
    success ? LogLevel.INFO : LogLevel.ERROR,
    `Navegação ${success ? 'bem-sucedida' : 'falhou'} para ${route} via ${method}`,
    { route, method, error, info }
  );
  
  // Registrar no console para depuração imediata
  if (success) {
    console.info(`✅ Navegação via ${method} para ${route} iniciada`);
  } else {
    console.error(`❌ Navegação via ${method} para ${route} falhou: ${error || 'Erro desconhecido'}`);
  }
  
  return log;
};

// Função para obter o último log de navegação
export const getLastNavigationLog = () => {
  return navigationLogs.length > 0 ? navigationLogs[navigationLogs.length - 1] : null;
};

// Função para obter todos os logs de navegação
export const getAllNavigationLogs = () => {
  return [...navigationLogs];
};

// Função para verificar a saúde da navegação
export const checkNavigationHealth = () => {
  // Verificar se houve falhas recentes
  const recentLogs = navigationLogs.slice(-5);
  const failedLogs = recentLogs.filter(log => !log.success);
  
  return {
    status: failedLogs.length === 0 ? 'healthy' : 'issues',
    recentFailures: failedLogs.length,
    totalLogs: navigationLogs.length,
    lastLog: navigationLogs.length > 0 ? navigationLogs[navigationLogs.length - 1] : null
  };
};

// Função para limpar logs
export const clearNavigationLogs = () => {
  navigationLogs.length = 0;
  console.info('Logs de navegação limpos');
};

