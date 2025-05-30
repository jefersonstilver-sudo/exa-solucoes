
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PixPaymentRealtimeWrapper from './PixPaymentRealtimeWrapper';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { useUserSession } from '@/hooks/useUserSession';
import { useMobileBreakpoints } from '@/hooks/useMobileBreakpoints';

interface PixPaymentContentProps {
  paymentData: PixPaymentData;
  onBack: () => void;
  onRefreshStatus: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  pedidoId: string | null;
}

const PixPaymentContent = ({
  paymentData,
  onBack,
  onRefreshStatus,
  isLoading,
  error,
  pedidoId
}: PixPaymentContentProps) => {
  const { user } = useUserSession();
  const { isMobile } = useMobileBreakpoints();

  return (
    <div className={`min-h-screen bg-gray-50 ${isMobile ? 'py-4' : 'py-8'}`}>
      <div className={`${isMobile ? 'px-4' : 'container mx-auto px-4 max-w-2xl'}`}>
        {/* Header */}
        <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
          <Button
            variant="ghost"
            onClick={onBack}
            className={`flex items-center text-gray-600 hover:text-gray-800 ${isMobile ? '-ml-2' : ''}`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isMobile ? 'Voltar' : 'Voltar ao checkout'}
          </Button>
        </div>

        {/* Título */}
        <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
          <h1 className={`font-bold text-gray-900 mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Pagamento via PIX
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-sm px-2' : ''}`}>
            {isMobile 
              ? 'Escaneie o QR code ou copie o código PIX'
              : 'Escaneie o QR code ou copie o código PIX para finalizar seu pagamento'
            }
          </p>
        </div>

        {/* Card principal */}
        <div className={`bg-white rounded-lg shadow-sm border ${isMobile ? 'p-4' : 'p-6'}`}>
          {/* Informações do pedido */}
          <div className={`bg-blue-50 rounded-lg ${isMobile ? 'p-3 mb-4' : 'p-4 mb-6'}`}>
            <h3 className={`font-medium text-blue-900 ${isMobile ? 'text-sm mb-1' : 'mb-2'}`}>
              Detalhes do Pedido
            </h3>
            <div className={`space-y-1 text-blue-800 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              <div>Pedido: {paymentData.pedidoId}</div>
              <div>Valor: R$ {paymentData.valorTotal.toFixed(2)}</div>
              <div>Status: {paymentData.status === 'pending' ? 'Aguardando pagamento' : paymentData.status}</div>
            </div>
          </div>

          {/* Wrapper com monitoramento em tempo real */}
          <PixPaymentRealtimeWrapper
            qrCodeBase64={paymentData.qrCodeBase64}
            qrCodeText={paymentData.qrCode}
            status={paymentData.status}
            paymentId={paymentData.paymentId}
            onRefreshStatus={onRefreshStatus}
            userId={user?.id}
            pedidoId={pedidoId}
          />
        </div>

        {/* Instruções */}
        <div className={`bg-white rounded-lg shadow-sm border ${isMobile ? 'p-4 mt-4' : 'p-6 mt-6'}`}>
          <h3 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-3'}`}>
            Como pagar com PIX
          </h3>
          <ol className={`list-decimal list-inside space-y-2 text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <li>Abra o aplicativo do seu banco</li>
            <li>Escolha a opção "Pagar com PIX"</li>
            <li>Escaneie o QR code ou copie e cole o código PIX</li>
            <li>Confirme o pagamento no seu aplicativo</li>
            <li>Aguarde a confirmação automática (pode levar alguns segundos)</li>
          </ol>
        </div>

        {/* Aviso de segurança */}
        <div className={`text-center text-gray-500 ${isMobile ? 'mt-4 text-xs' : 'mt-4 text-xs'}`}>
          🔒 Pagamento seguro processado pelo MercadoPago
        </div>
      </div>
    </div>
  );
};

export default PixPaymentContent;
