
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { QRCodeDisplay } from '@/components/checkout/payment/QRCodeDisplay';
import { toast } from 'sonner';
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

  const handlePaymentConfirmed = () => {
    // Log payment confirmation
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_EVENT,
      LogLevel.INFO,
      "Usuário confirmou pagamento PIX manualmente",
      { timestamp: new Date().toISOString() }
    );
    
    toast.success("Pagamento confirmado! Redirecionando...");
    
    // Close dialog
    onClose();
    
    // Redirect to client portal
    setTimeout(() => {
      window.location.href = '/pedidos'; // Portal do cliente/anunciante
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Pagamento PIX
          </DialogTitle>
          <DialogDescription className="text-center">
            Escaneie o QR Code ou copie o código para pagar
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
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

          {/* Botão "Já Paguei" */}
          <div className="w-full pt-4 border-t border-gray-200">
            <Button
              onClick={handlePaymentConfirmed}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Já Paguei
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Clique aqui após realizar o pagamento PIX
            </p>
          </div>
        </div>
        
        <div className="flex justify-center gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixQrCodeDialog;
