
import React, { useState } from 'react';
import PixPaymentDetails from './PixPaymentDetails';
import { useRealtimePaymentStatus } from '@/hooks/payment/useRealtimePaymentStatus';
import PaymentSuccessAnimation from './PaymentSuccessAnimation';

interface PixPaymentRealtimeWrapperProps {
  qrCodeBase64?: string;
  qrCodeText?: string;
  status: string;
  paymentId: string;
  onRefreshStatus: () => Promise<void>;
  userId?: string;
  pedidoId?: string;
}

const PixPaymentRealtimeWrapper = (props: PixPaymentRealtimeWrapperProps) => {
  const [paymentApproved, setPaymentApproved] = useState(false);

  // Configurar monitoramento em tempo real
  const { isListening } = useRealtimePaymentStatus({
    userId: props.userId,
    pedidoId: props.pedidoId,
    onPaymentApproved: () => {
      console.log("🎉 Pagamento aprovado via Realtime!");
      setPaymentApproved(true);
    }
  });

  // Se o pagamento foi aprovado via Realtime, mostrar animação de sucesso
  if (paymentApproved || props.status === 'approved') {
    return (
      <div className="text-center py-8">
        <PaymentSuccessAnimation 
          onContinue={() => {
            // Navegação será feita automaticamente pelo hook
          }}
          autoRedirectTimeout={3000}
        />
        <div className="mt-4 text-sm text-gray-500">
          {isListening ? "✅ Monitoramento ativo" : "📡 Conectando..."}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PixPaymentDetails {...props} />
      
      {/* Indicador de status do Realtime */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
          <span>
            {isListening ? "Monitorando pagamento em tempo real" : "Conectando ao sistema de pagamentos"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PixPaymentRealtimeWrapper;
