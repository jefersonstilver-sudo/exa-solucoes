
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface UseRealtimePaymentStatusProps {
  userId?: string;
  pedidoId?: string;
  onPaymentApproved?: () => void;
}

export const useRealtimePaymentStatus = ({
  userId,
  pedidoId,
  onPaymentApproved
}: UseRealtimePaymentStatusProps) => {
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || isListening) return;

    console.log("🔄 REALTIME: Iniciando monitoramento de pagamento para usuário:", userId);
    setIsListening(true);

    // Canal para monitorar inserções na tabela pedidos
    const pedidosChannel = supabase
      .channel('payment-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
          filter: `client_id=eq.${userId}`
        },
        (payload) => {
          console.log("🎉 REALTIME: Novo pedido detectado:", payload);
          
          const newOrder = payload.new;
          
          // Verificar se é um pagamento aprovado
          if (newOrder?.log_pagamento?.payment_status === 'approved') {
            console.log("✅ REALTIME: Pagamento aprovado detectado!");
            
            logCheckoutEvent(
              CheckoutEvent.PAYMENT_PROCESSING,
              LogLevel.INFO,
              "Pagamento PIX aprovado via Realtime",
              { 
                pedidoId: newOrder.id,
                userId,
                valor: newOrder.valor_total
              }
            );
            
            // Mostrar toast de sucesso
            toast.success("🎉 Pagamento aprovado!", {
              description: "Seu pedido foi confirmado com sucesso!",
              duration: 5000
            });
            
            // Callback personalizado se fornecido
            if (onPaymentApproved) {
              onPaymentApproved();
            }
            
            // Redirecionar para página de confirmação após um breve delay
            setTimeout(() => {
              navigate(`/pedido-confirmado?id=${newOrder.id}`);
            }, 2000);
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 REALTIME: Status da conexão:", status);
      });

    // Canal para monitorar atualizações em pedidos existentes
    const updatesChannel = supabase
      .channel('payment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `client_id=eq.${userId}`
        },
        (payload) => {
          console.log("🔄 REALTIME: Pedido atualizado:", payload);
          
          const updatedOrder = payload.new;
          
          // Verificar se status foi atualizado para pago
          if (updatedOrder?.status === 'pago_pendente_video' && 
              updatedOrder?.log_pagamento?.payment_status === 'approved') {
            
            console.log("✅ REALTIME: Status de pagamento atualizado para aprovado!");
            
            toast.success("💳 Pagamento confirmado!", {
              description: "Status do pedido atualizado",
              duration: 3000
            });
            
            if (onPaymentApproved) {
              onPaymentApproved();
            }
          }
        }
      )
      .subscribe();

    // Cleanup na desmontagem
    return () => {
      console.log("🛑 REALTIME: Desconectando canais de pagamento");
      supabase.removeChannel(pedidosChannel);
      supabase.removeChannel(updatesChannel);
      setIsListening(false);
    };
  }, [userId, isListening, navigate, onPaymentApproved]);

  return {
    isListening
  };
};
