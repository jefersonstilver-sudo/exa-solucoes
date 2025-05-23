
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ClientOnly } from '@/components/ui/client-only';
import PixPaymentDetails from '@/components/checkout/payment/PixPaymentDetails';
import PixPaymentDebugger from '@/components/checkout/payment/PixPaymentDebugger';
import { PixPaymentData } from '@/hooks/payment/usePixPayment';
import { useUserSession } from '@/hooks/useUserSession';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

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
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-[#1E1B4B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!isLoggedIn) {
    return null; // Will be redirected by the effect above
  }

  return (
    <ClientOnly>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center text-gray-600"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para checkout
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center">Pagamento via PIX</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border">
          <PixPaymentDetails
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
            <div className="mt-6">
              <Button
                onClick={handlePayWithPix}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-md flex items-center justify-center"
                data-testid="pay-with-pix-button"
                disabled={processando}
              >
                {processando ? (
                  <>
                    <span className="mr-2">Processando...</span>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>
                    <span className="mr-2">Abrir App do Banco para Pagar</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        
        {paymentData.status !== 'approved' && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Após realizar o pagamento, você será redirecionado automaticamente para a página de confirmação.</p>
          </div>
        )}
        
        {/* Debugger component */}
        <PixPaymentDebugger 
          paymentData={paymentData}
          error={error}
          isLoading={isLoading}
          pedidoId={pedidoId}
          onRefresh={onRefreshStatus}
        />
      </div>
    </ClientOnly>
  );
};

export default PixPaymentContent;
