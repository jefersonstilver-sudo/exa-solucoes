
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { QRCodeDisplay } from './QRCodeDisplay';
import PixCodeCopyField from './PixCodeCopyField';
import PaymentStatusBadge from './PaymentStatusBadge';
import RefreshStatusButton from './RefreshStatusButton';
import { getUserInfo, sendPixPaymentWebhook } from '@/utils/paymentWebhooks';

interface PixPaymentDetailsProps {
  qrCodeBase64: string;
  qrCodeText: string;
  status: string;
  paymentId: string;
  onRefreshStatus: () => Promise<void>;
  userId?: string;
}

const PixPaymentDetails = ({
  qrCodeBase64,
  qrCodeText,
  status,
  paymentId,
  onRefreshStatus,
  userId
}: PixPaymentDetailsProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle refresh status
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStatus();
      toast.success("Status atualizado");
    } catch (error) {
      console.error("[PixPaymentDetails] Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold">Pagamento via PIX</h2>
        <p className="text-sm text-gray-500">
          Escaneie o QR code ou copie o código PIX para pagar
        </p>
      </div>
      
      <div className="flex flex-col items-center justify-center">
        <PaymentStatusBadge status={status} />
      </div>
      
      {qrCodeBase64 && (
        <div className="flex flex-col items-center">
          <QRCodeDisplay qrCodeBase64={qrCodeBase64} />
        </div>
      )}
      
      {qrCodeText && (
        <div className="mt-4">
          <PixCodeCopyField code={qrCodeText} />
        </div>
      )}
      
      {/* Refresh status button */}
      <RefreshStatusButton
        onClick={handleRefreshStatus}
        isRefreshing={isRefreshing}
        status={status}
        className="mt-4"
      />
      
      <div className="text-xs text-gray-500 text-center mt-4">
        <p>ID do Pagamento: {paymentId}</p>
      </div>
    </div>
  );
};

export default PixPaymentDetails;
