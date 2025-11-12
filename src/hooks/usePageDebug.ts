/**
 * Hook para coletar informações de debug da página atual
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageDebugInfo, PageDebugInfo } from '@/services/debug/PageDebugRegistry';

interface PageDebugData {
  pageInfo: PageDebugInfo | null;
  currentPath: string;
  detectedErrors: {
    code: string;
    description: string;
    solution: string;
    sqlFix?: string;
    data?: any;
  }[];
  recentApiCalls: {
    url: string;
    method: string;
    status: number;
    duration: number;
    timestamp: string;
    error?: string;
  }[];
  performanceMetrics: {
    loadTime: number;
    renderCount: number;
    memoryUsage?: number;
  };
}

export const usePageDebug = () => {
  const location = useLocation();
  const [debugData, setDebugData] = useState<PageDebugData>({
    pageInfo: null,
    currentPath: location.pathname,
    detectedErrors: [],
    recentApiCalls: [],
    performanceMetrics: {
      loadTime: 0,
      renderCount: 0
    }
  });

  useEffect(() => {
    const startTime = performance.now();
    const pageInfo = getPageDebugInfo(location.pathname);
    
    setDebugData(prev => ({
      ...prev,
      pageInfo,
      currentPath: location.pathname,
      performanceMetrics: {
        ...prev.performanceMetrics,
        loadTime: performance.now() - startTime,
        renderCount: prev.performanceMetrics.renderCount + 1
      }
    }));
  }, [location.pathname]);

  // Interceptar fetch para coletar API calls
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : String(args[0]));
      const method = args[1]?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        
        setDebugData(prev => ({
          ...prev,
          recentApiCalls: [
            {
              url,
              method,
              status: response.status,
              duration,
              timestamp: new Date().toISOString()
            },
            ...prev.recentApiCalls.slice(0, 19) // Manter últimas 20
          ]
        }));
        
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        setDebugData(prev => ({
          ...prev,
          recentApiCalls: [
            {
              url,
              method,
              status: 0,
              duration,
              timestamp: new Date().toISOString(),
              error: String(error)
            },
            ...prev.recentApiCalls.slice(0, 19)
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
  }) => {
    setDebugData(prev => ({
      ...prev,
      detectedErrors: [error, ...prev.detectedErrors]
    }));
  };

  // Limpar erros
  const clearErrors = () => {
    setDebugData(prev => ({
      ...prev,
      detectedErrors: []
    }));
  };

  // Exportar dados de debug
  const exportDebugData = () => {
    const dataStr = JSON.stringify(debugData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-${location.pathname.replace(/\//g, '-')}-${Date.now()}.json`;
    a.click();
  };

  return {
    debugData,
    addDetectedError,
    clearErrors,
    exportDebugData
  };
};
