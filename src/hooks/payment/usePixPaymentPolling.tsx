
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  intervalMs = 10000 // 10 segundos por padrão - menos frequente
}: UsePixPaymentPollingProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const checkPaymentStatus = useCallback(async () => {
    if (!pedidoId || !isActive) return;
    
    try {
      setIsPolling(true);
      setLastChecked(new Date());
      
      console.log("🔄 POLLING: Verificando status do pagamento:", pedidoId);
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('status, log_pagamento')
        .eq('id', pedidoId)
        .single();
      
      if (error) {
        console.error("❌ POLLING: Erro ao verificar status:", error);
        return;
      }
      
      if (data) {
        const logPagamento = data.log_pagamento as any;
        const paymentStatus = logPagamento?.payment_status;
        
        console.log("📊 POLLING: Status atual:", {
          pedidoStatus: data.status,
          paymentStatus,
          timestamp: new Date().toISOString()
        });
        
        // Se o pagamento foi aprovado
        if (paymentStatus === 'approved' || data.status === 'pago_pendente_video') {
          console.log("🎉 POLLING: Pagamento aprovado detectado!");
          
          logCheckoutEvent(
            CheckoutEvent.PAYMENT_PROCESSING,
            LogLevel.INFO,
            "Pagamento PIX aprovado detectado via polling",
            { pedidoId, status: data.status, paymentStatus }
          );
          
          toast.success("🎉 Pagamento aprovado!", {
            description: "Seu pedido foi confirmado com sucesso!",
            duration: 5000
          });
          
          onPaymentApproved();
        }
      }
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
    const interval = setInterval(checkPaymentStatus, intervalMs);
    
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
