
import { useEffect, useState, useRef, useCallback } from 'react';
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
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const navigate = useNavigate();
  const channelsRef = useRef<any[]>([]);
  const isListeningRef = useRef(false);

  // Função de callback estabilizada
  const handlePaymentApproved = useCallback((orderData: any) => {
    console.log("🎉 REALTIME: Pagamento aprovado detectado!", orderData);
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      "Pagamento PIX aprovado via Realtime",
      { 
        pedidoId: orderData.id,
        userId,
        valor: orderData.valor_total
      }
    );
    
    // Show professional overlay instead of toast
    setShowSuccessOverlay(true);
    
    // Callback personalizado se fornecido
    if (onPaymentApproved) {
      onPaymentApproved();
    }
  }, [onPaymentApproved, userId]);

  const handleContinueAfterSuccess = useCallback(() => {
    setShowSuccessOverlay(false);
    console.log('💳 [useRealtimePaymentStatus] Navegando para Meus Pedidos após pagamento');
    navigate('/anunciante/meus-pedidos');
  }, [navigate]);

  useEffect(() => {
    // Evitar múltiplas execuções
    if (!userId || isListeningRef.current) {
      return;
    }

    console.log("🔄 REALTIME: Iniciando monitoramento de pagamento para usuário:", userId);
    
    // Marcar como listening
    isListeningRef.current = true;
    setIsListening(true);

    // Canal para monitorar inserções na tabela pedidos
    const pedidosChannel = supabase
      .channel(`payment-status-updates-${userId}`)
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
            handlePaymentApproved(newOrder);
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 REALTIME: Status da conexão pedidos:", status);
      });

    // Canal para monitorar atualizações em pedidos existentes
    const updatesChannel = supabase
      .channel(`payment-updates-${userId}`)
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

    // Armazenar referências dos canais
    channelsRef.current = [pedidosChannel, updatesChannel];

    // Cleanup na desmontagem
    return () => {
      console.log("🛑 REALTIME: Desconectando canais de pagamento");
      
      // Remover todos os canais
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      
      // Reset dos refs
      channelsRef.current = [];
      isListeningRef.current = false;
      setIsListening(false);
    };
  }, [userId, handlePaymentApproved]); // Apenas userId e handlePaymentApproved como dependências

  return {
    isListening,
    showSuccessOverlay,
    handleContinueAfterSuccess
  };
};
