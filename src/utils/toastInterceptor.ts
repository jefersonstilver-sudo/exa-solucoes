import { toast as originalToast } from 'sonner';
import { captureToast } from '@/hooks/useComprehensiveDebug';

// Interceptar todas as chamadas de toast
export const toast = {
  success: (message: string, ...args: any[]) => {
    captureToast('success', message);
    return originalToast.success(message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    captureToast('error', message);
    return originalToast.error(message, ...args);
  },
  warning: (message: string, ...args: any[]) => {
    captureToast('warning', message);
    return originalToast.warning(message, ...args);
  },
  info: (message: string, ...args: any[]) => {
    captureToast('info', message);
    return originalToast.info(message, ...args);
  },
};
