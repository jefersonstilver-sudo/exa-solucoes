
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
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

  const redirectToOrders = () => {
    console.log("🔄 Redirecionando para /advertiser/pedidos");
    
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      "Redirecionamento para meus pedidos iniciado",
      { timestamp: new Date().toISOString() }
    );

    // Usar navigate do React Router para redirecionamento imediato
    navigate('/advertiser/pedidos');
  };

  const handleClose = () => {
    console.log("❌ Botão fechar clicado - redirecionando");
    toast.info("Redirecionando para seus pedidos...");
    redirectToOrders();
  };

  const handlePaymentConfirmed = () => {
    console.log("✅ Pagamento confirmado - redirecionando");
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_EVENT,
      LogLevel.INFO,
      "Usuário confirmou pagamento PIX manualmente",
      { timestamp: new Date().toISOString() }
    );
    
    toast.success("Redirecionando para seus pedidos...");
    redirectToOrders();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-blue-50 to-green-50 border-2 border-blue-200 shadow-2xl">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute -right-2 -top-2 h-8 w-8 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <img 
                src="https://logospng.org/wp-content/uploads/mercado-pago.png" 
                alt="PIX" 
                className="h-8 w-auto filter brightness-0 invert"
              />
            </div>
            <div>
              <div className="text-gray-900">QR Code PIX</div>
              <div className="text-sm font-normal text-gray-600">Gerado com sucesso!</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          {finalQrCodeBase64 && (
            <div className="w-full flex justify-center">
              <div className="bg-white p-6 rounded-3xl border-2 border-gray-200 shadow-xl">
                <QRCodeDisplay qrCodeBase64={finalQrCodeBase64} />
              </div>
            </div>
          )}
          
          {finalQrCodeText && (
            <div className="w-full space-y-4">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-2xl border border-blue-200">
                <div className="text-xs text-gray-700 break-all font-mono bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  {finalQrCodeText.length > 60 ? `${finalQrCodeText.substring(0, 60)}...` : finalQrCodeText}
                </div>
              </div>
              <Button 
                onClick={handleCopyQrCode}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
                size="lg"
              >
                <Copy className="h-5 w-5 mr-2" />
                Copiar Código PIX
              </Button>
            </div>
          )}

          {/* Botão "Já Paguei" em destaque */}
          <div className="w-full pt-3">
            <Button
              onClick={handlePaymentConfirmed}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 text-xl font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-3xl transform hover:scale-105"
              size="lg"
            >
              <CheckCircle className="h-7 w-7 mr-3" />
              Já Paguei
            </Button>
            <p className="text-xs text-gray-600 text-center mt-3 font-medium">
              ✅ Clique aqui após realizar o pagamento
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixQrCodeDialog;
