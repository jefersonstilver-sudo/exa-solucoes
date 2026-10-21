
import { useState, useEffect, useCallback } from 'react';
import { verifyAsaasOrder } from '@/services/asaasPaymentService';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface UsePixPaymentPollingProps {
  pedidoId: string | null;
  isActive: boolean;
  onPaymentApproved: () => void;
  intervalMs?: number;
}

export const usePixPaymentPolling = ({
  pedidoId,
  isActive,
  onPaymentApproved,
  intervalMs = 60000 // 10 segundos por padrão - menos frequente
}: UsePixPaymentPollingProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const checkPaymentStatus = useCallback(async () => {
    if (!pedidoId || !isActive) return;
    
    try {
      setIsPolling(true);
      setLastChecked(new Date());
      
      console.log("🔄 POLLING: Verificando status do pagamento:", pedidoId);
      
      const data = await verifyAsaasOrder(pedidoId);
      if (data.payment_approved) onPaymentApproved();
    } catch (error) {
      console.error("💥 POLLING: Erro crítico:", error);
    } finally {
      setIsPolling(false);
    }
  }, [pedidoId, isActive, onPaymentApproved]);
  
  // Polling automático menos agressivo
  useEffect(() => {
    if (!isActive || !pedidoId) return;
    
    console.log("🚀 POLLING: Iniciando polling automático", { pedidoId, intervalMs });
    
    // Primeira verificação após 5 segundos
    const initialTimeout = setTimeout(checkPaymentStatus, 5000);
    
    // Intervalo regular
    const interval = setInterval(checkPaymentStatus, Math.max(60000, intervalMs));
    
    return () => {
      console.log("🛑 POLLING: Parando polling automático");
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [checkPaymentStatus, isActive, pedidoId, intervalMs]);
  
  return {
    isPolling,
    lastChecked,
    checkPaymentStatus
  };
};
