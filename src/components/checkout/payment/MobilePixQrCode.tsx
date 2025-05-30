
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, QrCode, CheckCircle } from 'lucide-react';
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

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      window.location.href = '/advertiser/pedidos';
    }, 300);
  };

  const handlePaymentConfirmed = () => {
    toast.success("Redirecionando para seus pedidos...");
    onClose();
    setTimeout(() => {
      window.location.href = '/advertiser/pedidos';
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">PIX</h3>
                <p className="text-sm text-gray-500">Pagamento instantâneo</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-10 w-10 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Amount */}
            <div className="text-center bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <p className="text-sm text-green-700 mb-1">Valor a pagar</p>
              <p className="text-3xl font-bold text-green-800">
                R$ {amount.toFixed(2)}
              </p>
            </div>

            {/* QR Code */}
            <Card className="border-2 border-gray-200 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {qrCodeBase64 ? (
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-xl border-2 border-gray-100">
                        <img
                          src={`data:image/png;base64,${qrCodeBase64}`}
                          alt="QR Code PIX"
                          className="w-48 h-48 rounded-lg"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200">
                      <QrCode className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PIX Code */}
            {qrCodeText && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-600 break-all font-mono bg-white p-3 rounded-lg border">
                    {qrCodeText.substring(0, 50)}...
                  </p>
                </div>
                <Button
                  onClick={copyPixCode}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl"
                  size="lg"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Copiar código PIX
                </Button>
              </div>
            )}

            {/* Botão "Já Paguei" */}
            <Button
              onClick={handlePaymentConfirmed}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl"
              size="lg"
            >
              <CheckCircle className="h-6 w-6 mr-3" />
              Já Paguei
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MobilePixQrCode;
