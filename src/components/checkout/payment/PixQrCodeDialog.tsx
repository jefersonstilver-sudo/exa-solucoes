
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { QRCodeDisplay } from '@/components/checkout/payment/QRCodeDisplay';
import { toast } from 'sonner';
import PixCountdownTimer from '@/components/checkout/payment/PixCountdownTimer';
import PaymentSuccessAnimation from '@/components/checkout/payment/PaymentSuccessAnimation';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface PixQrCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeBase64?: string;
  qrCodeText?: string;
  paymentLink?: string;
  pix_url?: string;
  pix_base64?: string;
}

const PixQrCodeDialog = ({
  isOpen,
  onClose,
  qrCodeBase64,
  qrCodeText,
  paymentLink,
  pix_url,
  pix_base64
}: PixQrCodeDialogProps) => {
  // Use pix_url/pix_base64 if available, otherwise fall back to the original fields
  const finalQrCodeBase64 = pix_base64 || qrCodeBase64;
  const finalQrCodeText = pix_url || qrCodeText;

  // QR Code expiration time (5 minutes = 300 seconds)
  const QR_EXPIRATION_TIME = 300;
  
  // States
  const [isExpired, setIsExpired] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(QR_EXPIRATION_TIME);
  
  // Simulação de verificação de pagamento (em um caso real, isso seria uma API)
  useEffect(() => {
    if (isExpired || paymentConfirmed) return;
    
    const checkInterval = setInterval(() => {
      // Aqui seria a verificação real do pagamento
      // Para simular, vamos apenas criar um efeito de demonstração
      const shouldConfirm = Math.random() < 0.01; // 1% chance de confirmar (apenas para demo)
      
      if (shouldConfirm && !isExpired) {
        setPaymentConfirmed(true);
        clearInterval(checkInterval);
        
        // Log payment confirmation
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_EVENT,
          LogLevel.INFO,
          "Pagamento PIX confirmado (simulação)",
          { timestamp: new Date().toISOString() }
        );
        
        // Após a animação, redirecionar para página de upload
        setTimeout(() => {
          onClose();
          window.location.href = '/pedido-confirmado'; // Redirecionar para página de upload
        }, 3000);
      }
    }, 3000);
    
    return () => clearInterval(checkInterval);
  }, [isExpired, onClose, paymentConfirmed]);

  const handleCopyQrCode = () => {
    if (finalQrCodeText) {
      navigator.clipboard.writeText(finalQrCodeText)
        .then(() => toast.success("Código PIX copiado para a área de transferência"))
        .catch(() => toast.error("Erro ao copiar código PIX"));
      
      // Log copy action
      logCheckoutEvent(
        CheckoutEvent.USER_ACTION,
        LogLevel.INFO,
        "Usuário copiou código PIX",
        { timestamp: new Date().toISOString() }
      );
    }
  };
  
  const handleExpire = () => {
    setIsExpired(true);
    toast.warning("QR Code expirado. O popup será fechado automaticamente.");
    
    // Log expiration
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_EVENT,
      LogLevel.WARNING,
      "QR Code PIX expirado",
      { timestamp: new Date().toISOString() }
    );
    
    // Fecha o diálogo automaticamente após 3 segundos
    setTimeout(() => {
      onClose();
    }, 3000);
  };
  
  // Update time remaining from timer component
  const handleTimeUpdate = (seconds: number) => {
    setTimeRemaining(seconds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {paymentConfirmed ? (
          <PaymentSuccessAnimation
            onContinue={() => {
              onClose();
              window.location.href = '/pedido-confirmado';
            }}
            autoRedirectTimeout={3000}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold">
                {isExpired ? "QR Code Expirado" : "Pagamento PIX"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {isExpired 
                  ? "O tempo para pagamento expirou. Feche e tente novamente." 
                  : "Escaneie o QR Code ou copie o código para pagar"
                }
              </DialogDescription>
            </DialogHeader>
            
            {!isExpired && (
              <div className="flex flex-col items-center space-y-6 py-4">
                {/* Timer de 5 minutos - em destaque com cor vermelha */}
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-center mb-3">
                    <p className="text-red-700 font-semibold text-lg">
                      ⏰ Tempo para pagamento: {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                    </p>
                    <p className="text-red-600 text-sm">
                      Pague rapidamente! O código expira em 5 minutos.
                    </p>
                  </div>
                  <div className="w-full">
                    <PixCountdownTimer
                      initialSeconds={QR_EXPIRATION_TIME}
                      onExpire={handleExpire}
                      isActive={!isExpired}
                      onTimeUpdate={handleTimeUpdate}
                    />
                  </div>
                </div>

                {finalQrCodeBase64 && (
                  <div className="w-full flex flex-col items-center space-y-3">
                    <div className="w-full flex justify-center">
                      <QRCodeDisplay qrCodeBase64={finalQrCodeBase64} />
                    </div>
                  </div>
                )}
                
                {finalQrCodeText && (
                  <div className="w-full">
                    <div className="flex flex-col space-y-3">
                      <label className="text-sm font-medium text-gray-700 text-center">
                        Ou copie e cole o código PIX:
                      </label>
                      <div className="relative">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs overflow-x-auto max-w-full whitespace-nowrap">
                          {finalQrCodeText.length > 50 ? `${finalQrCodeText.substring(0, 50)}...` : finalQrCodeText}
                        </div>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={handleCopyQrCode}
                          className="w-full mt-2 bg-green-600 hover:bg-green-700"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Código PIX
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                {isExpired ? "Fechar" : "Cancelar"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixQrCodeDialog;
