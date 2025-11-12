import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { VideoDebugger } from '@/utils/videoDebugger';

interface ComprehensiveDebugData {
  timestamp: string;
  brasilia_time: string;
  session_duration: string;
  current_route: string;
  page_context: {
    url: string;
    title: string;
    referrer: string;
  };
  errors: Array<{
    timestamp: string;
    type: string;
    message: string;
    stack?: string;
    source: 'console' | 'toast' | 'network' | 'react';
  }>;
  toasts: Array<{
    timestamp: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>;
  console_logs: Array<{
    timestamp: string;
    level: 'log' | 'warn' | 'error' | 'info';
    message: string;
    data?: any;
  }>;
  network_requests: Array<{
    timestamp: string;
    url: string;
    method: string;
    status: number;
    duration: number;
    success?: boolean;
    error?: string;
  }>;
  video_logs: any[];
  performance: {
    memory?: any;
    timing?: any;
    resources?: any[];
  };
  user_agent: string;
  screen_resolution: string;
}

// Storage global para capturar tudo
const debugStorage = {
  errors: [] as any[],
  toasts: [] as any[],
  consoleLogs: [] as any[],
  networkRequests: [] as any[],
  sessionStartTime: Date.now(),
};

// Interceptar console
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

const formatTimestamp = () => {
  const now = new Date();
  const offset = -3 * 60; // Brasília UTC-3
  const brasiliaTime = new Date(now.getTime() + offset * 60 * 1000);
  
  const day = String(brasiliaTime.getUTCDate()).padStart(2, '0');
  const month = String(brasiliaTime.getUTCMonth() + 1).padStart(2, '0');
  const year = brasiliaTime.getUTCFullYear();
  const hours = String(brasiliaTime.getUTCHours()).padStart(2, '0');
  const minutes = String(brasiliaTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(brasiliaTime.getUTCSeconds()).padStart(2, '0');
  const ms = String(brasiliaTime.getUTCMilliseconds()).padStart(3, '0');
  
  return {
    iso: now.toISOString(),
    brasilia: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}.${ms}`,
    utc: now.toISOString(),
  };
};

// Interceptar console.error, console.warn, etc
(['log', 'warn', 'error', 'info'] as const).forEach((level) => {
  (console as any)[level] = (...args: any[]) => {
    const timestamp = formatTimestamp();
    debugStorage.consoleLogs.push({
      timestamp: timestamp.brasilia,
      iso: timestamp.iso,
      level,
      message: args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        } catch {
          return String(arg);
        }
      }).join(' '),
      data: args,
    });
    
    // Manter apenas últimos 200 logs
    if (debugStorage.consoleLogs.length > 200) {
      debugStorage.consoleLogs.shift();
    }
    
    originalConsole[level as keyof typeof originalConsole].apply(console, args);
  };
});

// Interceptar fetch para capturar network requests
const originalFetch = window.fetch;
window.fetch = async (...args: Parameters<typeof fetch>) => {
  const startTime = performance.now();
  const timestamp = formatTimestamp();
  const requestInfo = args[0];
  const url = typeof requestInfo === 'string' ? requestInfo : requestInfo instanceof Request ? requestInfo.url : String(requestInfo);
  const method = args[1]?.method || 'GET';

  try {
    const response = await originalFetch(...args);
    const duration = performance.now() - startTime;
    
    debugStorage.networkRequests.push({
      timestamp: timestamp.brasilia,
      iso: timestamp.iso,
      url,
      method,
      status: response.status,
      duration: Math.round(duration),
      success: response.ok,
    });
    
    // Manter apenas últimos 100 requests
    if (debugStorage.networkRequests.length > 100) {
      debugStorage.networkRequests.shift();
    }
    
    return response;
  } catch (error: any) {
    const duration = performance.now() - startTime;
    
    debugStorage.networkRequests.push({
      timestamp: timestamp.brasilia,
      iso: timestamp.iso,
      url,
      method,
      status: 0,
      duration: Math.round(duration),
      error: error.message,
      success: false,
    });
    
    debugStorage.errors.push({
      timestamp: timestamp.brasilia,
      iso: timestamp.iso,
      type: 'NETWORK_ERROR',
      message: error.message,
      source: 'network',
      url,
      method,
    });
    
    throw error;
  }
};

// Interceptar window.onerror
window.addEventListener('error', (event) => {
  const timestamp = formatTimestamp();
  debugStorage.errors.push({
    timestamp: timestamp.brasilia,
    iso: timestamp.iso,
    type: 'RUNTIME_ERROR',
    message: event.message,
    source: 'react',
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Interceptar unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const timestamp = formatTimestamp();
  debugStorage.errors.push({
    timestamp: timestamp.brasilia,
    iso: timestamp.iso,
    type: 'UNHANDLED_REJECTION',
    message: event.reason?.message || String(event.reason),
    source: 'react',
    stack: event.reason?.stack,
  });
});

// Hook para interceptar toasts
export const captureToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
  const timestamp = formatTimestamp();
  debugStorage.toasts.push({
    timestamp: timestamp.brasilia,
    iso: timestamp.iso,
    type,
    message,
  });
  
  // Se for erro, também adicionar aos erros
  if (type === 'error') {
    debugStorage.errors.push({
      timestamp: timestamp.brasilia,
      iso: timestamp.iso,
      type: 'TOAST_ERROR',
      message,
      source: 'toast',
    });
  }
  
  // Manter apenas últimos 100 toasts
  if (debugStorage.toasts.length > 100) {
    debugStorage.toasts.shift();
  }
};

// Expor captureToast globalmente
if (typeof window !== 'undefined') {
  (window as any).__captureToast = captureToast;
}

export const useComprehensiveDebug = () => {
  const location = useLocation();
  const [debugData, setDebugData] = useState<ComprehensiveDebugData | null>(null);

  const collectDebugData = (): ComprehensiveDebugData => {
    const now = new Date();
    const timestamp = formatTimestamp();
    const sessionDuration = Date.now() - debugStorage.sessionStartTime;
    const minutes = Math.floor(sessionDuration / 60000);
    const seconds = Math.floor((sessionDuration % 60000) / 1000);

    // Coletar performance data
    const performance = {
      memory: (window.performance as any).memory ? {
        usedJSHeapSize: (window.performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (window.performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (window.performance as any).memory.jsHeapSizeLimit,
      } : undefined,
      timing: window.performance.timing ? {
        loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
        domReady: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
      } : undefined,
    };

    return {
      timestamp: timestamp.iso,
      brasilia_time: timestamp.brasilia,
      session_duration: `${minutes}m ${seconds}s`,
      current_route: location.pathname + location.search,
      page_context: {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      },
      errors: [...debugStorage.errors].sort((a, b) => 
        new Date(b.iso).getTime() - new Date(a.iso).getTime()
      ),
      toasts: [...debugStorage.toasts].sort((a, b) => 
        new Date(b.iso).getTime() - new Date(a.iso).getTime()
      ),
      console_logs: [...debugStorage.consoleLogs].sort((a, b) => 
        new Date(b.iso).getTime() - new Date(a.iso).getTime()
      ),
      network_requests: [...debugStorage.networkRequests].sort((a, b) => 
        new Date(b.iso).getTime() - new Date(a.iso).getTime()
      ),
      video_logs: VideoDebugger.getLogs(),
      performance,
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
    };
  };

  const exportCompleteDebug = () => {
    const data = collectDebugData();
    const formatted = JSON.stringify(data, null, 2);
    return formatted;
  };

  const copyCompleteDebug = async () => {
    const data = exportCompleteDebug();
    await navigator.clipboard.writeText(data);
    return data;
  };

  const clearAllDebugData = () => {
    debugStorage.errors = [];
    debugStorage.toasts = [];
    debugStorage.consoleLogs = [];
    debugStorage.networkRequests = [];
    VideoDebugger.clearLogs();
  };

  useEffect(() => {
    const data = collectDebugData();
    setDebugData(data);
  }, [location.pathname]);

  return {
    debugData,
    collectDebugData,
    exportCompleteDebug,
    copyCompleteDebug,
    clearAllDebugData,
    stats: {
      totalErrors: debugStorage.errors.length,
      totalToasts: debugStorage.toasts.length,
      totalLogs: debugStorage.consoleLogs.length,
      totalRequests: debugStorage.networkRequests.length,
    },
  };
};
