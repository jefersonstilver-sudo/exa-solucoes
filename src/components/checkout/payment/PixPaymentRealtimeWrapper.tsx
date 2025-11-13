
import React, { useState, useEffect, useRef } from 'react';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 🎵 Inicializar som de notificação
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,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');
  }, []);

  // Função para lidar com pagamento aprovado
  const handlePaymentApproved = () => {
    console.log("🎉 Pagamento aprovado detectado!");
    setPaymentApproved(true);
    
    // 🎵 Tocar som de notificação
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('🔇 Could not play notification sound:', err));
    }
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
    intervalMs: 5000 // Verificar a cada 5 segundos
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
