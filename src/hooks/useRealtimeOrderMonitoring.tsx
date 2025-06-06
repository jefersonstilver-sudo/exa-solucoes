
// Hook para Monitoramento em Tempo Real de Pedidos

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderAlert {
  id: string;
  type: 'new_order' | 'payment_received' | 'duplicate_detected' | 'price_inconsistency';
  message: string;
  data: any;
  timestamp: string;
}

export const useRealtimeOrderMonitoring = () => {
  const [alerts, setAlerts] = useState<OrderAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    console.log("👁️ [OrderMonitoring] INICIANDO MONITORAMENTO EM TEMPO REAL");

    // Monitorar novos pedidos
    const ordersChannel = supabase
      .channel('orders_monitor')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        (payload) => {
          console.log("🔔 [OrderMonitoring] NOVO PEDIDO DETECTADO:", payload.new);
          
          const newAlert: OrderAlert = {
            id: `order_${payload.new.id}`,
            type: 'new_order',
            message: `Novo pedido criado: R$ ${payload.new.valor_total}`,
            data: payload.new,
            timestamp: new Date().toISOString()
          };
          
          setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Manter apenas 10 alertas
          
          // Toast notification
          toast.success(`Novo pedido: R$ ${payload.new.valor_total}`);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        (payload) => {
          // Detectar mudanças de status para pago
          if (payload.new.status === 'pago' && payload.old.status === 'pendente') {
            console.log("💰 [OrderMonitoring] PAGAMENTO CONFIRMADO:", payload.new);
            
            const paymentAlert: OrderAlert = {
              id: `payment_${payload.new.id}`,
              type: 'payment_received',
              message: `Pagamento confirmado: R$ ${payload.new.valor_total}`,
              data: payload.new,
              timestamp: new Date().toISOString()
            };
            
            setAlerts(prev => [paymentAlert, ...prev.slice(0, 9)]);
            toast.success(`💰 Pagamento confirmado: R$ ${payload.new.valor_total}`);
          }
        }
      )
      .subscribe();

    // Monitorar tentativas (para detectar problemas)
    const attemptsChannel = supabase
      .channel('attempts_monitor')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tentativas_compra' },
        (payload) => {
          console.log("🔔 [OrderMonitoring] NOVA TENTATIVA DETECTADA:", payload.new);
          
          // Se o valor é muito baixo, pode ser um erro
          if (payload.new.valor_total > 0 && payload.new.valor_total < 0.50) {
            const suspiciousAlert: OrderAlert = {
              id: `suspicious_${payload.new.id}`,
              type: 'price_inconsistency',
              message: `Tentativa com valor suspeito: R$ ${payload.new.valor_total}`,
              data: payload.new,
              timestamp: new Date().toISOString()
            };
            
            setAlerts(prev => [suspiciousAlert, ...prev.slice(0, 9)]);
            toast.warning(`⚠️ Valor suspeito: R$ ${payload.new.valor_total}`);
          }
        }
      )
      .subscribe();

    // Monitorar webhooks para detectar problemas de processamento
    const webhooksChannel = supabase
      .channel('webhooks_monitor')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webhook_logs' },
        (payload) => {
          console.log("🔔 [OrderMonitoring] NOVO WEBHOOK:", payload.new);
          
          if (payload.new.status === 'error') {
            toast.error(`❌ Erro no webhook: ${payload.new.origem}`);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("👁️ [OrderMonitoring] PARANDO MONITORAMENTO");
      ordersChannel.unsubscribe();
      attemptsChannel.unsubscribe();
      webhooksChannel.unsubscribe();
    };
  }, [isMonitoring]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    toast.success("🔴 Monitoramento em tempo real ativado");
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    toast.info("⚫ Monitoramento pausado");
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  return {
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearAlerts
  };
};
