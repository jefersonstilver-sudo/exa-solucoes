
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
  pollingInterval = 5000 // 5 segundos
}: UsePixPaymentPollingProps) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string>('');

  const checkPaymentStatus = async () => {
    if (!pedidoId) return;

    try {
      console.log("🔍 [PixPolling] Verificando status do pedido:", pedidoId);
      setLastChecked(new Date());

      const { data: pedido, error } = await supabase
        .from('pedidos')
        .select('status, log_pagamento')
        .eq('id', pedidoId)
        .single();

      if (error) {
        console.error("❌ [PixPolling] Erro ao verificar status:", error);
        return;
      }

      if (pedido) {
        const currentStatus = pedido.status;
        const logPagamento = pedido.log_pagamento as any;

        console.log("📊 [PixPolling] Status atual:", {
          status: currentStatus,
          previousStatus: lastStatusRef.current,
          hasLogPagamento: !!logPagamento
        });

        // Verificar se o pagamento foi aprovado
        if (currentStatus === 'pago' && lastStatusRef.current !== currentStatus) {
          console.log("✅ [PixPolling] Pagamento aprovado detectado!");
          
          setIsPolling(false);
          onPaymentApproved();
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // Verificar dados PIX no log_pagamento
        if (logPagamento?.pixData?.status === 'approved' || 
            logPagamento?.pix_data?.status === 'approved') {
          console.log("✅ [PixPolling] PIX aprovado via log_pagamento!");
          
          setIsPolling(false);
          onPaymentApproved();
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // Verificar se o pagamento expirou (5 minutos)
        if (logPagamento?.expires_at) {
          const expirationTime = new Date(logPagamento.expires_at);
          const now = new Date();
          
          if (now > expirationTime) {
            console.log("⏰ [PixPolling] Pagamento expirado, cancelando pedido");
            
            // Cancelar pedido automaticamente
            await supabase
              .from('pedidos')
              .update({ status: 'cancelado_expirado' })
              .eq('id', pedidoId);
            
            setIsPolling(false);
            toast.error('⏰ Tempo de pagamento expirado. Pedido cancelado.');
            
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return;
          }
        }

        lastStatusRef.current = currentStatus;
      }

    } catch (error) {
      console.error("❌ [PixPolling] Erro no polling:", error);
    }
  };

  const startPolling = () => {
    if (!pedidoId || !isActive) return;

    console.log("🚀 [PixPolling] Iniciando polling para pedido:", pedidoId);
    
    setIsPolling(true);
    
    // Verificação inicial
    checkPaymentStatus();
    
    // Configurar polling periódico a cada 5 segundos
    intervalRef.current = setInterval(checkPaymentStatus, pollingInterval);
    
    // Timeout para parar polling após 5 minutos
    setTimeout(() => {
      if (intervalRef.current) {
        console.log("⏰ [PixPolling] Timeout de 5 minutos - parando polling");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsPolling(false);
      }
    }, 5 * 60 * 1000); // 5 minutos
  };

  const stopPolling = () => {
    console.log("🛑 [PixPolling] Parando polling");
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };

  // Iniciar/parar polling baseado no status ativo
  useEffect(() => {
    if (isActive && pedidoId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [isActive, pedidoId]);

  // Realtime subscription para detecção instantânea
  useEffect(() => {
    if (!pedidoId || !isActive) return;

    console.log("📡 [PixPolling] Configurando realtime subscription");

    const subscription = supabase
      .channel(`pedido-${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `id=eq.${pedidoId}`
        },
        (payload) => {
          console.log("📡 [PixPolling] Realtime update recebido:", payload.new);
          
          const newStatus = (payload.new as any)?.status;
          
          if (newStatus === 'pago') {
            console.log("✅ [PixPolling] Pagamento aprovado via realtime!");
            toast.success('🎉 Pagamento aprovado!');
            onPaymentApproved();
          }
        }
      )
      .subscribe();

    return () => {
      console.log("🔌 [PixPolling] Removendo realtime subscription");
      supabase.removeChannel(subscription);
    };
  }, [pedidoId, isActive, onPaymentApproved]);

  return {
    isPolling,
    lastChecked,
    startPolling,
    stopPolling,
    checkPaymentStatus
  };
};
