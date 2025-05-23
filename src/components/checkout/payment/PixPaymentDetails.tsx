
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { QRCodeDisplay } from './QRCodeDisplay';
import PixCodeCopyField from './PixCodeCopyField';
import PaymentStatusBadge from './PaymentStatusBadge';
import RefreshStatusButton from './RefreshStatusButton';
import { getUserInfo } from '@/utils/paymentWebhooks';
import { useNavigate } from 'react-router-dom';
import PixCountdownTimer from './PixCountdownTimer';
import PaymentSuccessAnimation from './PaymentSuccessAnimation';

interface PixPaymentDetailsProps {
  qrCodeBase64?: string;
  qrCodeText?: string;
  status: string;
  paymentId: string;
  onRefreshStatus: () => Promise<void>;
  userId?: string;
  pedidoId?: string;
}

const PixPaymentDetails = ({
  qrCodeBase64,
  qrCodeText,
  status,
  paymentId,
  onRefreshStatus,
  userId,
  pedidoId
}: PixPaymentDetailsProps) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataValidated, setDataValidated] = useState<boolean>(false);
  const [isQrExpired, setIsQrExpired] = useState<boolean>(false);
  
  // QR Code expiration time (5 minutes = 300 seconds)
  const QR_EXPIRATION_TIME = 300;
  
  // Log QR code data on component mount
  useEffect(() => {
    console.log('[PixPaymentDetails] Rendered with QR code data:', {
      hasQRCodeBase64: !!qrCodeBase64,
      hasQRCodeText: !!qrCodeText,
      status,
      paymentId,
      pedidoId
    });
    
    // Basic validation of QR code data
    const hasValidQR = !!qrCodeBase64 || !!qrCodeText;
    setDataValidated(true);
    
    // Log validation result
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `PIX QR Code validation: ${hasValidQR ? 'Success' : 'Failed'}`,
      { hasQRCodeBase64: !!qrCodeBase64, hasQRCodeText: !!qrCodeText, paymentId }
    );
    
    if (!hasValidQR) {
      console.warn('[PixPaymentDetails] Missing QR code data, might need to refresh');
    }
    
    // Set up more frequent status checking (every 5 seconds)
    const statusCheckInterval = setInterval(() => {
      if (status !== 'approved' && !isRefreshing) {
        console.log('[PixPaymentDetails] Checking payment status automatically');
        onRefreshStatus().catch(err => {
          console.error('[PixPaymentDetails] Error checking payment status:', err);
        });
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [qrCodeBase64, qrCodeText, status, paymentId, onRefreshStatus]);
  
  // Handle QR code expiration
  const handleQrExpiration = () => {
    setIsQrExpired(true);
    console.log('[PixPaymentDetails] QR code expired after 5 minutes');
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `PIX QR code expired after 5 minutes`,
      { paymentId, status }
    );
    
    toast.warning("QR Code expirado. Por favor, gere um novo QR code.");
  };
  
  // Handle refresh status
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStatus();
      toast.success("Status atualizado");
      
      // Log successful refresh
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Status de pagamento PIX atualizado manualmente`,
        { paymentId, previousStatus: status }
      );
      
      // If status is approved, redirect to the order confirmation page
      if (status === 'approved' && pedidoId) {
        // Save order ID to localStorage before redirecting
        localStorage.setItem('lastCompletedOrderId', pedidoId);
      }
    } catch (error) {
      console.error("[PixPaymentDetails] Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
      
      // Log refresh error
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao atualizar status PIX manualmente`,
        { paymentId, error: String(error) }
      );
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle continue to next step when payment is approved
  const handleContinue = () => {
    if (pedidoId) {
      // Save order ID to localStorage before redirecting
      localStorage.setItem('lastCompletedOrderId', pedidoId);
      
      // Redirect to order confirmation page
      navigate(`/pedido-confirmado?id=${pedidoId}`);
    } else {
      toast.error("ID do pedido não encontrado");
    }
  };
  
  // Render component based on data state
  if (!dataValidated) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="h-8 w-8 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500">Validando dados de pagamento...</p>
      </div>
    );
  }
  
  // If payment is approved, show success screen
  if (status === 'approved') {
    return (
      <div className="space-y-6 text-center">
        <PaymentSuccessAnimation 
          onContinue={handleContinue} 
          autoRedirectTimeout={2000} 
        />
      </div>
    );
  }
  
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
        
        {!isQrExpired && (
          <div className="mt-4">
            <PixCountdownTimer
              initialSeconds={QR_EXPIRATION_TIME}
              onExpire={handleQrExpiration}
              isActive={status !== 'approved'}
            />
          </div>
        )}
      </div>
      
      {qrCodeBase64 && !isQrExpired && status !== 'approved' ? (
        <div className="flex flex-col items-center">
          <QRCodeDisplay qrCodeBase64={qrCodeBase64} />
        </div>
      ) : isQrExpired ? (
        <div className="flex flex-col items-center justify-center p-6 border border-orange-200 bg-orange-50 rounded-lg">
          <AlertTriangle className="h-8 w-8 text-orange-500 mb-2" />
          <p className="text-sm text-center text-gray-700 mb-1">
            QR Code expirado
          </p>
          <p className="text-xs text-center text-gray-500">
            O tempo para pagamento expirou. Por favor, gere um novo QR code.
          </p>
          <Button 
            onClick={handleRefreshStatus} 
            variant="outline" 
            className="mt-4"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Gerando novo QR...' : 'Gerar novo QR code'}
          </Button>
        </div>
      ) : !qrCodeBase64 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-orange-200 bg-orange-50 rounded-lg">
          <AlertTriangle className="h-8 w-8 text-orange-500 mb-2" />
          <p className="text-sm text-center text-gray-700 mb-1">
            QR Code não disponível
          </p>
          <p className="text-xs text-center text-gray-500">
            Por favor, atualize o status ou entre em contato com o suporte
          </p>
          <Button 
            onClick={handleRefreshStatus} 
            variant="outline" 
            className="mt-4"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Tentar novamente'}
          </Button>
        </div>
      ) : null}
      
      {qrCodeText && !isQrExpired && status !== 'approved' && (
        <div className="mt-4">
          <PixCodeCopyField code={qrCodeText} />
        </div>
      )}
      
      {/* Refresh status button - Only show if QR is not expired and payment not approved */}
      {!isQrExpired && status !== 'approved' && (
        <RefreshStatusButton
          onClick={handleRefreshStatus}
          isRefreshing={isRefreshing}
          status={status}
          className="mt-4"
        />
      )}
      
      <div className="text-xs text-gray-500 text-center mt-4">
        <p>ID do Pagamento: {paymentId}</p>
        <p>Após o pagamento, você será automaticamente redirecionado para o próximo passo.</p>
      </div>
    </div>
  );
};

export default PixPaymentDetails;
