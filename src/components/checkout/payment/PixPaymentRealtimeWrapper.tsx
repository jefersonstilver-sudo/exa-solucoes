
import React, { useState } from 'react';
import PixPaymentDetails from './PixPaymentDetails';
import { useRealtimePaymentStatus } from '@/hooks/payment/useRealtimePaymentStatus';
import { usePixPaymentPolling } from '@/hooks/payment/usePixPaymentPolling';
import PaymentSuccessAnimationPremium from '@/components/payment/PaymentSuccessAnimationPremium';
import PixQrCodePopup from '@/components/payment/PixQrCodePopup';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface PixPaymentRealtimeWrapperProps {
  qrCodeBase64?: string;
  qrCodeText?: string;
  status: string;
  paymentId: string;
  onRefreshStatus: () => Promise<void>;
  userId?: string;
  pedidoId?: string;
  valorTotal?: number;
  expiresAt?: string;
}

const PixPaymentRealtimeWrapper = (props: PixPaymentRealtimeWrapperProps) => {
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [showQrPopup, setShowQrPopup] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Função para lidar com pagamento aprovado
  const handlePaymentApproved = () => {
    console.log("🎉 Pagamento aprovado detectado!");
    setPaymentApproved(true);
    setShowQrPopup(false);
    setShowSuccessAnimation(true);
    toast.success('🎉 Pagamento PIX aprovado!', {
      description: 'Redirecionando para seus pedidos...',
      duration: 3000
    });
  };

  // Configurar monitoramento em tempo real
  const { isListening } = useRealtimePaymentStatus({
    userId: props.userId,
    pedidoId: props.pedidoId,
    onPaymentApproved: handlePaymentApproved
  });

  // Configurar polling como fallback com intervalo de 5 segundos
  const { isPolling, lastChecked } = usePixPaymentPolling({
    pedidoId: props.pedidoId,
    isActive: !paymentApproved && props.status !== 'approved',
    onPaymentApproved: handlePaymentApproved,
    pollingInterval: 5000
  });

  // Mostrar QR Code em pop-up elegante
  const handleShowQrCode = () => {
    if (!props.qrCodeBase64 && !props.qrCodeText) {
      toast.error('QR Code não disponível. Aguarde a geração...');
      return;
    }
    setShowQrPopup(true);
  };

  // Se o pagamento foi aprovado, mostrar animação de sucesso
  if (showSuccessAnimation) {
    return (
      <PaymentSuccessAnimationPremium
        onComplete={() => {
          // Redirecionamento será feito automaticamente
          setShowSuccessAnimation(false);
        }}
        redirectDelay={3000}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Detalhes do pagamento PIX */}
      <PixPaymentDetails {...props} />
      
      {/* Botão principal para mostrar QR Code */}
      <div className="text-center">
        <Button
          onClick={handleShowQrCode}
          disabled={!props.qrCodeBase64 && !props.qrCodeText}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 text-lg font-bold rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
          size="lg"
        >
          <QrCode className="h-6 w-6 mr-3" />
          📱 Ver QR Code PIX
        </Button>
        <p className="text-sm text-gray-600 mt-2">
          Clique para abrir o QR Code em tela cheia
        </p>
      </div>
      
      {/* Indicadores de status de monitoramento */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-gray-900">📊 Status do Monitoramento</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {/* Status do Realtime */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isListening ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <span className="text-gray-600">
              📡 Realtime: {isListening ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          {/* Status do Polling */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isPolling ? 'bg-blue-400 animate-pulse' : 'bg-gray-300'
            }`}></div>
            <span className="text-gray-600">
              🔄 Polling: {isPolling ? 'Verificando...' : 'Aguardando'}
            </span>
          </div>
        </div>
        
        {/* Última verificação */}
        {lastChecked && (
          <div className="text-xs text-gray-500">
            ⏰ Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
          </div>
        )}
        
        <div className="text-xs text-green-600 font-medium">
          ✅ Sistema monitorando pagamento automaticamente a cada 5 segundos
        </div>
      </div>

      {/* Pop-up do QR Code */}
      <PixQrCodePopup
        isOpen={showQrPopup}
        onClose={() => setShowQrPopup(false)}
        qrCodeBase64={props.qrCodeBase64}
        pixCode={props.qrCodeText}
        amount={props.valorTotal || 0}
        expiresAt={props.expiresAt}
        onRefresh={props.onRefreshStatus}
      />
    </div>
  );
};

export default PixPaymentRealtimeWrapper;
