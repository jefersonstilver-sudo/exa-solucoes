/**
 * Inicializador do sistema de debug
 * Intercepta automaticamente toasts do sonner
 */

import { useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';

export const DebugInitializer = () => {
  useEffect(() => {
    // Interceptar todos os métodos do toast
    const originalMethods = {
      success: sonnerToast.success,
      error: sonnerToast.error,
      warning: sonnerToast.warning,
      info: sonnerToast.info,
      message: sonnerToast.message,
    };

    // Substituir métodos do sonner para capturar no debug
    sonnerToast.success = (message: any, data?: any) => {
      if (typeof window !== 'undefined' && (window as any).__captureToast) {
        const msg = typeof message === 'string' ? message : JSON.stringify(message);
        (window as any).__captureToast('success', msg);
      }
      return originalMethods.success(message, data);
    };

    sonnerToast.error = (message: any, data?: any) => {
      if (typeof window !== 'undefined' && (window as any).__captureToast) {
        const msg = typeof message === 'string' ? message : JSON.stringify(message);
        (window as any).__captureToast('error', msg);
      }
      return originalMethods.error(message, data);
    };

    sonnerToast.warning = (message: any, data?: any) => {
      if (typeof window !== 'undefined' && (window as any).__captureToast) {
        const msg = typeof message === 'string' ? message : JSON.stringify(message);
        (window as any).__captureToast('warning', msg);
      }
      return originalMethods.warning(message, data);
    };

    sonnerToast.info = (message: any, data?: any) => {
      if (typeof window !== 'undefined' && (window as any).__captureToast) {
        const msg = typeof message === 'string' ? message : JSON.stringify(message);
        (window as any).__captureToast('info', msg);
      }
      return originalMethods.info(message, data);
    };

    // Cleanup não é necessário pois queremos manter as interceptações
    return () => {
      // Não restaurar - manter interceptações ativas
    };
  }, []);

  return null;
};
