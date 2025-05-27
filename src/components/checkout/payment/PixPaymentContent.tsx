
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientOnly } from '@/components/ui/client-only';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { useUserSession } from '@/hooks/useUserSession';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import PixPaymentDebugger from '@/components/checkout/payment/PixPaymentDebugger';
import BackToCheckoutButton from '@/components/checkout/payment/BackToCheckoutButton';
import PixPaymentHeader from '@/components/checkout/payment/PixPaymentHeader';
import PixMobilePayButton from '@/components/checkout/payment/PixMobilePayButton';
import PixPaymentInstructions from '@/components/checkout/payment/PixPaymentInstructions';
import PixContentContainer from '@/components/checkout/payment/PixContentContainer';
import PixPaymentLoadingState from '@/components/checkout/payment/PixPaymentLoadingState';
import PixPaymentRealtimeWrapper from '@/components/checkout/payment/PixPaymentRealtimeWrapper';

interface PixPaymentContentProps {
  paymentData: PixPaymentData;
  onBack: () => void;
  onRefreshStatus: () => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  pedidoId: string | null;
}

const PixPaymentContent = ({ 
  paymentData, 
  onBack, 
  onRefreshStatus,
  isLoading = false,
  error = null,
  pedidoId
}: PixPaymentContentProps) => {
  const { user, isLoggedIn, isLoading: isSessionLoading } = useUserSession();
  const navigate = useNavigate();
  const [processando, setProcessando] = useState(false);
  
  // Check authentication on mount
  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) {
      toast.error("Usuário não autenticado");
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, isSessionLoading, navigate]);
  
  // Check payment status more frequently
  useEffect(() => {
    // Only set up automatic checking if payment is still pending
    if (paymentData.status !== 'approved') {
      const checkStatusInterval = setInterval(() => {
        onRefreshStatus().catch(err => {
          console.error("Error checking payment status:", err);
        });
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(checkStatusInterval);
    }
  }, [paymentData.status, onRefreshStatus]);

  // Function to handle the webhook call when paying with PIX
  const handlePayWithPix = async () => {
    try {
      // Verify user is authenticated
      if (!isLoggedIn || !user) {
        toast.error("Usuário não autenticado");
        navigate('/login?redirect=/checkout');
        return;
      }
      
      // Set processing state
      setProcessando(true);
      
      console.log("[PixPaymentContent] Botão 'Pagar com PIX' clicado na página de pagamento");
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        "Botão 'Pagar com PIX' clicado na página de pagamento PIX",
        { 
          timestamp: new Date().toISOString(), 
          pedidoId,
          paymentId: paymentData.paymentId,
          hasQRCode: !!paymentData.qrCode,
          userId: user.id
        }
      );
      
      // Refresh payment status
      await onRefreshStatus();
      setProcessando(false);
      
      // If payment is not approved yet, show a guide toast
      if (paymentData.status !== 'approved') {
        toast("Para pagar, escaneie o QR code com seu app do banco", {
          description: "Após o pagamento, o sistema detectará automaticamente",
          duration: 5000
        });
      }
    } catch (error) {
      console.error("[PixPaymentContent] Erro ao processar pagamento:", error);
      setProcessando(false);
      toast.error("Erro ao processar pagamento");
    }
  };

  // Don't render content if user is not authenticated
  if (isSessionLoading) {
    return <PixPaymentLoadingState />;
  }
  
  if (!isLoggedIn) {
    return null; // Will be redirected by the effect above
  }

  return (
    <ClientOnly>
      <PixContentContainer>
        <BackToCheckoutButton onBack={onBack} />
        
        <PixPaymentHeader />
        
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          {/* NOVO: Wrapper com Realtime */}
          <PixPaymentRealtimeWrapper
            qrCodeBase64={paymentData.qrCodeBase64 || ''}
            qrCodeText={paymentData.qrCode || ''} 
            status={paymentData.status}
            paymentId={paymentData.paymentId || ''}
            onRefreshStatus={onRefreshStatus}
            userId={user?.id}
            pedidoId={pedidoId}
          />
          
          {/* Pay with PIX button only shown if payment not approved */}
          {paymentData.status !== 'approved' && (
            <PixMobilePayButton
              onClick={handlePayWithPix}
              isProcessing={processando}
            />
          )}
        </div>
        
        {paymentData.status !== 'approved' && (
          <PixPaymentInstructions />
        )}
        
        {/* Debugger component */}
        <PixPaymentDebugger 
          paymentData={paymentData}
          error={error}
          isLoading={isLoading}
          pedidoId={pedidoId}
          onRefresh={onRefreshStatus}
        />
      </PixContentContainer>
    </ClientOnly>
  );
};

export default PixPaymentContent;
