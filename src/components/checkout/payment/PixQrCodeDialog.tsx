
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, X } from 'lucide-react';
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
        .then(() => toast.success("Código PIX copiado!"))
        .catch(() => toast.error("Erro ao copiar código PIX"));
      
      logCheckoutEvent(
        CheckoutEvent.USER_ACTION,
        LogLevel.INFO,
        "Usuário copiou código PIX",
        { timestamp: new Date().toISOString() }
      );
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      window.location.href = '/advertiser/pedidos';
    }, 300);
  };

  const handlePaymentConfirmed = () => {
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_EVENT,
      LogLevel.INFO,
      "Usuário confirmou pagamento PIX manualmente",
      { timestamp: new Date().toISOString() }
    );
    
    toast.success("Redirecionando para seus pedidos...");
    
    onClose();
    setTimeout(() => {
      window.location.href = '/advertiser/pedidos';
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 shadow-2xl">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute -right-2 -top-2 h-8 w-8 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
              <img 
                src="https://logospng.org/wp-content/uploads/mercado-pago.png" 
                alt="PIX" 
                className="h-8 w-auto filter brightness-0 invert"
              />
            </div>
            <div>
              <div className="text-gray-900">Pagamento PIX</div>
              <div className="text-sm font-normal text-gray-500">Escaneie ou copie o código</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-6">
          {finalQrCodeBase64 && (
            <div className="w-full flex justify-center">
              <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
                <QRCodeDisplay qrCodeBase64={finalQrCodeBase64} />
              </div>
            </div>
          )}
          
          {finalQrCodeText && (
            <div className="w-full space-y-4">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                <div className="text-xs text-gray-600 break-all font-mono bg-white p-3 rounded-lg border">
                  {finalQrCodeText.length > 60 ? `${finalQrCodeText.substring(0, 60)}...` : finalQrCodeText}
                </div>
              </div>
              <Button 
                onClick={handleCopyQrCode}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
                size="lg"
              >
                <Copy className="h-5 w-5 mr-2" />
                Copiar Código PIX
              </Button>
            </div>
          )}

          {/* Botão "Já Paguei" em destaque */}
          <div className="w-full pt-2">
            <Button
              onClick={handlePaymentConfirmed}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-semibold rounded-xl shadow-xl transition-all duration-200 hover:shadow-2xl transform hover:scale-105"
              size="lg"
            >
              <CheckCircle className="h-6 w-6 mr-3" />
              Já Paguei
            </Button>
            <p className="text-xs text-gray-500 text-center mt-3">
              Clique aqui após realizar o pagamento
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixQrCodeDialog;
