/**
 * Hook para coletar informações de debug da página atual
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageDebugInfo, PageDebugInfo } from '@/services/debug/PageDebugRegistry';

interface PageDebugData {
  pageInfo: PageDebugInfo | null;
  currentPath: string;
  sessionStartTime: string;
  detectedErrors: {
    code: string;
    description: string;
    solution: string;
    sqlFix?: string;
    data?: any;
    timestamp: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }[];
  recentApiCalls: {
    url: string;
    method: string;
    status: number;
    duration: number;
    timestamp: string;
    timestampMs: number;
    error?: string;
    requestBody?: any;
    responsePreview?: string;
  }[];
  performanceMetrics: {
    loadTime: number;
    renderCount: number;
    memoryUsage?: number;
    lastRenderTime: string;
    domNodes?: number;
    heapSize?: number;
  };
  consoleHistory: {
    type: 'log' | 'warn' | 'error' | 'info';
    message: string;
    timestamp: string;
    timestampMs: number;
    args?: any[];
  }[];
  componentState?: Record<string, any>;
}

export const usePageDebug = () => {
  const location = useLocation();
  const [debugData, setDebugData] = useState<PageDebugData>({
    pageInfo: null,
    currentPath: location.pathname,
    sessionStartTime: new Date().toISOString(),
    detectedErrors: [],
    recentApiCalls: [],
    performanceMetrics: {
      loadTime: 0,
      renderCount: 0,
      lastRenderTime: new Date().toISOString()
    },
    consoleHistory: [],
    componentState: {}
  });

  useEffect(() => {
    const startTime = performance.now();
    const pageInfo = getPageDebugInfo(location.pathname);
    
    // Capturar informações de memória se disponível
    const memoryInfo = (performance as any).memory;
    const domNodes = document.getElementsByTagName('*').length;
    
    setDebugData(prev => ({
      ...prev,
      pageInfo,
      currentPath: location.pathname,
      performanceMetrics: {
        ...prev.performanceMetrics,
        loadTime: performance.now() - startTime,
        renderCount: prev.performanceMetrics.renderCount + 1,
        lastRenderTime: new Date().toISOString(),
        memoryUsage: memoryInfo?.usedJSHeapSize,
        heapSize: memoryInfo?.totalJSHeapSize,
        domNodes
      }
    }));
  }, [location.pathname]);

  // Interceptar console para histórico
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;
    
    const addConsoleLog = (type: 'log' | 'warn' | 'error' | 'info', args: any[]) => {
      const timestamp = new Date();
      setDebugData(prev => ({
        ...prev,
        consoleHistory: [
          {
            type,
            message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '),
            timestamp: timestamp.toISOString(),
            timestampMs: timestamp.getTime(),
            args
          },
          ...prev.consoleHistory.slice(0, 49) // Manter últimos 50
        ]
      }));
    };
    
    console.log = (...args) => {
      addConsoleLog('log', args);
      originalLog(...args);
    };
    
    console.warn = (...args) => {
      addConsoleLog('warn', args);
      originalWarn(...args);
    };
    
    console.error = (...args) => {
      addConsoleLog('error', args);
      originalError(...args);
    };
    
    console.info = (...args) => {
      addConsoleLog('info', args);
      originalInfo(...args);
    };
    
    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      console.info = originalInfo;
    };
  }, []);

  // Interceptar fetch para coletar API calls
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const timestampStart = new Date();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : String(args[0]));
      const method = args[1]?.method || 'GET';
      const requestBody = args[1]?.body ? JSON.parse(args[1].body as string) : undefined;
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        const timestampEnd = new Date();
        
        // Tentar capturar preview da resposta
        let responsePreview = '';
        try {
          const clonedResponse = response.clone();
          const text = await clonedResponse.text();
          responsePreview = text.substring(0, 200);
        } catch (e) {
          responsePreview = 'Unable to preview';
        }
        
        setDebugData(prev => ({
          ...prev,
          recentApiCalls: [
            {
              url,
              method,
              status: response.status,
              duration,
              timestamp: timestampEnd.toISOString(),
              timestampMs: timestampEnd.getTime(),
              requestBody,
              responsePreview
            },
            ...prev.recentApiCalls.slice(0, 29) // Manter últimas 30
          ]
        }));
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        const timestampEnd = new Date();
        
        setDebugData(prev => ({
          ...prev,
          recentApiCalls: [
            {
              url,
              method,
              status: 0,
              duration,
              timestamp: timestampEnd.toISOString(),
              timestampMs: timestampEnd.getTime(),
              error: String(error),
              requestBody
            },
            ...prev.recentApiCalls.slice(0, 29)
          ]
        }));
        
        throw error;
      }
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Adicionar erro detectado manualmente
  const addDetectedError = (error: {
    code: string;
    description: string;
    solution: string;
    sqlFix?: string;
    data?: any;
    severity?: 'critical' | 'high' | 'medium' | 'low';
  }) => {
    setDebugData(prev => ({
      ...prev,
      detectedErrors: [
        {
          ...error,
          timestamp: new Date().toISOString(),
          severity: error.severity || 'medium'
        },
        ...prev.detectedErrors
      ]
    }));
  };

  // Limpar erros
  const clearErrors = () => {
    setDebugData(prev => ({
      ...prev,
      detectedErrors: []
    }));
  };

  // Atualizar estado do componente (chamado externamente)
  const updateComponentState = (componentName: string, state: any) => {
    setDebugData(prev => ({
      ...prev,
      componentState: {
        ...prev.componentState,
        [componentName]: {
          ...state,
          _lastUpdate: new Date().toISOString()
        }
      }
    }));
  };

  // Exportar dados de debug
  const exportDebugData = () => {
    const exportData = {
      ...debugData,
      exportTimestamp: new Date().toISOString(),
      sessionDuration: `${((new Date().getTime() - new Date(debugData.sessionStartTime).getTime()) / 1000).toFixed(2)}s`,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      online: navigator.onLine
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `debug-${location.pathname.replace(/\//g, '-')}-${timestamp}.json`;
    a.click();
  };

  return {
    debugData,
    addDetectedError,
    clearErrors,
    exportDebugData,
    updateComponentState
  };
};
