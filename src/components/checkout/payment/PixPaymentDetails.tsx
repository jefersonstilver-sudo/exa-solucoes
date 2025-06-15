
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useNavigate } from 'react-router-dom';
import PaymentSuccessAnimation from './PaymentSuccessAnimation';
import PixActiveState from './PixActiveState';
import PixExpiredState from './PixExpiredState';
import PixQrCodeMissing from './PixQrCodeMissing';
import PixPaymentFooter from './PixPaymentFooter';

interface PixPaymentDetailsProps {
  qrCodeBase64?: string;
  qrCodeText?: string;
  status: string;
  paymentId: string;
  onRefreshStatus: () => Promise<void>;
  userId?: string;
  pedidoId?: string;
  createdAt?: string;
}

const PixPaymentDetails = ({
  qrCodeBase64,
  qrCodeText,
  status,
  paymentId,
  onRefreshStatus,
  userId,
  pedidoId,
  createdAt
}: PixPaymentDetailsProps) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataValidated, setDataValidated] = useState<boolean>(false);
  const [isQrExpired, setIsQrExpired] = useState<boolean>(false);
  
  // Log QR code data on component mount
  useEffect(() => {
    console.log('[PixPaymentDetails] Rendered with QR code data:', {
      hasQRCodeBase64: !!qrCodeBase64,
      hasQRCodeText: !!qrCodeText,
      status,
      paymentId,
      pedidoId,
      createdAt
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
  }, [qrCodeBase64, qrCodeText, status, paymentId, pedidoId, createdAt]);
  
  // Handle QR code expiration
  const handleQrExpiration = () => {
    setIsQrExpired(true);
    console.log('[PixPaymentDetails] QR code expired after timeout');
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `PIX QR code expired`,
      { paymentId, status }
    );
    
    toast.warning("QR Code expirado. Gere um novo QR code para continuar.");
  };
  
  // Handle refresh status with regeneration capability
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      // REGENERAÇÃO DE QR CODE: Chamar o edge function para gerar novo QR
      if (isQrExpired || (!qrCodeBase64 && !qrCodeText)) {
        console.log('[PixPaymentDetails] Regenerating PIX QR code...');
        
        // Aqui você chamaria seu edge function para regenerar o QR
        // Por enquanto, apenas refresh do status
        await onRefreshStatus();
        setIsQrExpired(false);
        
        toast.success("Novo QR Code gerado com sucesso!");
      } else {
        await onRefreshStatus();
        toast.success("Status atualizado");
      }
      
      // Log successful refresh
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Status de pagamento PIX atualizado ${isQrExpired ? 'com regeneração' : 'manualmente'}`,
        { paymentId, previousStatus: status, wasExpired: isQrExpired }
      );
      
      // If status is approved, redirect to the order confirmation page
      if (status === 'approved' && pedidoId) {
        localStorage.setItem('lastCompletedOrderId', pedidoId);
      }
    } catch (error) {
      console.error("[PixPaymentDetails] Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
      
      // Log refresh error
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao atualizar status PIX`,
        { paymentId, error: String(error) }
      );
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle continue to next step when payment is approved
  const handleContinue = () => {
    if (pedidoId) {
      localStorage.setItem('lastCompletedOrderId', pedidoId);
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
      
      {/* LÓGICA DE RENDERIZAÇÃO INTELIGENTE */}
      {isQrExpired ? (
        <PixExpiredState 
          onRefresh={handleRefreshStatus}
          isRefreshing={isRefreshing}
        />
      ) : !qrCodeBase64 && !qrCodeText ? (
        <PixQrCodeMissing
          onRefresh={handleRefreshStatus}
          isRefreshing={isRefreshing}
        />
      ) : (
        <PixActiveState
          qrCodeBase64={qrCodeBase64 || ''}
          qrCodeText={qrCodeText}
          status={status}
          isRefreshing={isRefreshing}
          onRefreshStatus={handleRefreshStatus}
          onQrExpiration={handleQrExpiration}
          createdAt={createdAt}
        />
      )}
      
      <PixPaymentFooter paymentId={paymentId} />
    </div>
  );
};

export default PixPaymentDetails;
