
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsePixPaymentPollingProps {
  pedidoId: string | null;
  isActive: boolean;
  onPaymentApproved: () => void;
  pollingInterval?: number;
}

export const usePixPaymentPolling = ({
  pedidoId,
  isActive,
  onPaymentApproved,
  pollingInterval = 10000 // 10 segundos - mais otimizado
}: UsePixPaymentPollingProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string>('');
  const checkCountRef = useRef<number>(0);

  const checkPaymentStatus = async () => {
    if (!pedidoId) return;

    try {
      console.log(`🔍 [PixPolling-V2] Check #${checkCountRef.current + 1} - Pedido:`, pedidoId);
      setLastChecked(new Date());
      checkCountRef.current++;

      const { data: pedido, error } = await supabase
        .from('pedidos')
        .select('status, log_pagamento')
        .eq('id', pedidoId)
        .single();

      if (error) {
        console.error("❌ [PixPolling-V2] Erro:", error);
        return;
      }

      if (pedido) {
        const currentStatus = pedido.status;
        
        console.log(`📊 [PixPolling-V2] Status:`, {
          status: currentStatus,
          check: checkCountRef.current,
          changed: lastStatusRef.current !== currentStatus
        });

        // Verificar pagamento aprovado
        if (currentStatus === 'pago' && lastStatusRef.current !== currentStatus) {
          console.log("✅ [PixPolling-V2] PAGAMENTO APROVADO!");
          
          setIsPolling(false);
          onPaymentApproved();
          
          // Parar polling
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          toast.success('🎉 Pagamento aprovado!');
          return;
        }

        lastStatusRef.current = currentStatus;
      }

    } catch (error) {
      console.error("❌ [PixPolling-V2] Erro no polling:", error);
    }
  };

  const startPolling = () => {
    if (!pedidoId || !isActive || intervalRef.current) return;

    console.log("🚀 [PixPolling-V2] Iniciando polling otimizado");
    
    setIsPolling(true);
    checkCountRef.current = 0;
    
    // Verificação inicial
    checkPaymentStatus();
    
    // Polling a cada 10 segundos
    intervalRef.current = setInterval(checkPaymentStatus, pollingInterval);
    
    // Auto-stop após 10 minutos (60 checks)
    setTimeout(() => {
      if (intervalRef.current) {
        console.log("⏰ [PixPolling-V2] Auto-stop após 10 minutos");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsPolling(false);
      }
    }, 10 * 60 * 1000);
  };

  const stopPolling = () => {
    console.log("🛑 [PixPolling-V2] Parando polling");
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    checkCountRef.current = 0;
  };

  // Controle de polling
  useEffect(() => {
    if (isActive && pedidoId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [isActive, pedidoId]);

  return {
    isPolling,
    lastChecked,
    startPolling,
    stopPolling,
    checkPaymentStatus,
    checkCount: checkCountRef.current
  };
};
