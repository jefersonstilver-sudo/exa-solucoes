
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PixPaymentRealtimeWrapper from './PixPaymentRealtimeWrapper';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { useUserSession } from '@/hooks/useUserSession';

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao checkout
          </Button>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento via PIX
          </h1>
          <p className="text-gray-600">
            Escaneie o QR code ou copie o código PIX para finalizar seu pagamento
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Informações do pedido */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">Detalhes do Pedido</h3>
            <div className="space-y-1 text-sm text-blue-800">
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
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-medium text-gray-900 mb-3">Como pagar com PIX</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Abra o aplicativo do seu banco</li>
            <li>Escolha a opção "Pagar com PIX"</li>
            <li>Escaneie o QR code ou copie e cole o código PIX</li>
            <li>Confirme o pagamento no seu aplicativo</li>
            <li>Aguarde a confirmação automática (pode levar alguns segundos)</li>
          </ol>
        </div>

        {/* Aviso de segurança */}
        <div className="mt-4 text-center text-xs text-gray-500">
          🔒 Pagamento seguro processado pelo MercadoPago
        </div>
      </div>
    </div>
  );
};

export default PixPaymentContent;
