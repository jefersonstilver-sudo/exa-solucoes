
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { QRCodeDisplay } from '@/components/checkout/payment/QRCodeDisplay';
import { toast } from 'sonner';
import PixCountdownTimer from '@/components/checkout/payment/PixCountdownTimer';

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

  const handleCopyQrCode = () => {
    if (finalQrCodeText) {
      navigator.clipboard.writeText(finalQrCodeText)
        .then(() => toast.success("Código PIX copiado para a área de transferência"))
        .catch(() => toast.error("Erro ao copiar código PIX"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento PIX</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o código para pagar
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Add countdown timer */}
          <div className="w-full">
            <PixCountdownTimer
              initialSeconds={QR_EXPIRATION_TIME}
              onExpire={() => {
                toast.warning("QR Code expirado. Feche e reabra para gerar um novo código.");
              }}
              isActive={true}
            />
          </div>
          
          {finalQrCodeBase64 && (
            <div className="w-full flex justify-center">
              <QRCodeDisplay qrCodeBase64={finalQrCodeBase64} />
            </div>
          )}
          
          {finalQrCodeText && (
            <div className="w-full">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Código PIX Copia e Cola
                </label>
                <div className="relative">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs overflow-x-auto max-w-full whitespace-nowrap">
                    {finalQrCodeText.length > 50 ? `${finalQrCodeText.substring(0, 50)}...` : finalQrCodeText}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleCopyQrCode}
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copiar código</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Removed the "Abrir PIX no App" button */}
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixQrCodeDialog;
