
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
import { Copy, ExternalLink } from 'lucide-react';
import { QRCodeDisplay } from '@/components/checkout/payment/QRCodeDisplay';
import { toast } from 'sonner';

interface PixQrCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeBase64?: string;
  qrCodeText?: string;
  paymentLink?: string;
}

const PixQrCodeDialog = ({
  isOpen,
  onClose,
  qrCodeBase64,
  qrCodeText,
  paymentLink
}: PixQrCodeDialogProps) => {
  const handleCopyQrCode = () => {
    if (qrCodeText) {
      navigator.clipboard.writeText(qrCodeText)
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
          {qrCodeBase64 && (
            <div className="w-full flex justify-center">
              <QRCodeDisplay qrCodeBase64={qrCodeBase64} />
            </div>
          )}
          
          {qrCodeText && (
            <div className="w-full">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Código PIX Copia e Cola
                </label>
                <div className="relative">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs overflow-x-auto max-w-full whitespace-nowrap">
                    {qrCodeText.length > 50 ? `${qrCodeText.substring(0, 50)}...` : qrCodeText}
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
          
          {paymentLink && (
            <div className="w-full">
              <a 
                href={paymentLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                <span className="mr-2">Abrir PIX no App</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
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
