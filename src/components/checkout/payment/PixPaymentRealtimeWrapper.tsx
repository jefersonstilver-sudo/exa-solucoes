
import React, { useState } from 'react';
import PixPaymentDetails from './PixPaymentDetails';
import { useRealtimePaymentStatus } from '@/hooks/payment/useRealtimePaymentStatus';
import { usePixPaymentPolling } from '@/hooks/payment/usePixPaymentPolling';
import PaymentSuccessAnimation from './PaymentSuccessAnimation';
import PixPaymentTimer from './PixPaymentTimer';

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
  const [qrExpired, setQrExpired] = useState(false);

  // Função para lidar com pagamento aprovado
  const handlePaymentApproved = () => {
    console.log("🎉 Pagamento aprovado detectado!");
    setPaymentApproved(true);
  };

  // Configurar monitoramento em tempo real
  const { isListening } = useRealtimePaymentStatus({
    userId: props.userId,
    pedidoId: props.pedidoId,
    onPaymentApproved: handlePaymentApproved
  });

  // Configurar polling como fallback
  const { isPolling, lastChecked, checkPaymentStatus } = usePixPaymentPolling({
    pedidoId: props.pedidoId,
    isActive: !paymentApproved && props.status !== 'approved',
    onPaymentApproved: handlePaymentApproved,
    pollingInterval: 5000 // Verificar a cada 5 segundos
  });

  // Se o pagamento foi aprovado, mostrar animação de sucesso
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
          ✅ Pagamento confirmado com sucesso!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timer para QR Code */}
      <PixPaymentTimer
        initialSeconds={600} // 10 minutos
        onExpire={() => setQrExpired(true)}
        onRefresh={async () => {
          setQrExpired(false);
          await props.onRefreshStatus();
        }}
        isActive={!paymentApproved && props.status !== 'approved'}
        isRefreshing={false}
      />
      
      {/* Detalhes do pagamento PIX */}
      <PixPaymentDetails {...props} />
      
      {/* Indicadores de status */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-gray-900">Status do Monitoramento</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {/* Status do Realtime */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isListening ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <span className="text-gray-600">
              Realtime: {isListening ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          {/* Status do Polling */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isPolling ? 'bg-blue-400 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <span className="text-gray-600">
              Polling: {isPolling ? 'Verificando...' : 'Aguardando'}
            </span>
          </div>
        </div>
        
        {/* Última verificação */}
        {lastChecked && (
          <div className="text-xs text-gray-500">
            Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </div>
    </div>
  );
};

export default PixPaymentRealtimeWrapper;
