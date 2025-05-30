
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Copy, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface MobilePixQrCodeProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeBase64?: string;
  qrCodeText?: string;
  amount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const MobilePixQrCode = ({
  isOpen,
  onClose,
  qrCodeBase64,
  qrCodeText,
  amount,
  onRefresh,
  isRefreshing
}: MobilePixQrCodeProps) => {
  const copyPixCode = async () => {
    if (qrCodeText) {
      try {
        await navigator.clipboard.writeText(qrCodeText);
        toast.success('Código PIX copiado!');
      } catch (error) {
        console.error('Erro ao copiar:', error);
        toast.error('Erro ao copiar código PIX');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Pagamento PIX</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Amount */}
            <div className="text-center">
              <p className="text-sm text-gray-600">Valor a pagar</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {amount.toFixed(2)}
              </p>
            </div>

            {/* QR Code */}
            <Card>
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  {qrCodeBase64 ? (
                    <div className="flex justify-center">
                      <img
                        src={`data:image/png;base64,${qrCodeBase64}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 border rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600">
                    Escaneie o QR code com o app do seu banco
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PIX Code */}
            {qrCodeText && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-900">
                      Ou copie o código PIX:
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 break-all font-mono">
                        {qrCodeText.substring(0, 50)}...
                      </p>
                    </div>
                    <Button
                      onClick={copyPixCode}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar código PIX
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Como pagar:
                </h4>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha "Pagar com PIX"</li>
                  <li>Escaneie o QR code ou cole o código</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </CardContent>
            </Card>

            {/* Refresh button */}
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="w-full"
            >
              {isRefreshing ? (
                <>
                  <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar QR Code
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MobilePixQrCode;
