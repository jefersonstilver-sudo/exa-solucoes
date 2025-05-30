
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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

  const redirectToOrders = () => {
    console.log("🔄 Mobile: Redirecionando para /advertiser/pedidos");
    
    // Usar navigate do React Router para redirecionamento imediato
    navigate('/advertiser/pedidos');
  };

  const handleClose = () => {
    console.log("❌ Mobile: Botão fechar clicado - redirecionando");
    toast.info("Redirecionando para seus pedidos...");
    redirectToOrders();
  };

  const handlePaymentConfirmed = () => {
    console.log("✅ Mobile: Pagamento confirmado - redirecionando");
    toast.success("Redirecionando para seus pedidos...");
    redirectToOrders();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-white via-blue-50 to-green-50 rounded-3xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto border-2 border-blue-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <QrCode className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">QR Code PIX</h3>
                <p className="text-sm text-gray-600">Gerado com sucesso!</p>
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
            <div className="text-center bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-2xl border border-green-200">
              <p className="text-sm text-green-700 mb-1">Valor a pagar</p>
              <p className="text-3xl font-bold text-green-800">
                R$ {amount.toFixed(2)}
              </p>
            </div>

            {/* QR Code */}
            <Card className="border-2 border-blue-200 shadow-xl">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {qrCodeBase64 ? (
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-lg">
                        <img
                          src={`data:image/png;base64,${qrCodeBase64}`}
                          alt="QR Code PIX"
                          className="w-48 h-48 rounded-lg"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-200">
                      <QrCode className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* PIX Code */}
            {qrCodeText && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-2xl border border-blue-200">
                  <p className="text-xs text-gray-700 break-all font-mono bg-white p-3 rounded-xl border shadow-sm">
                    {qrCodeText.substring(0, 50)}...
                  </p>
                </div>
                <Button
                  onClick={copyPixCode}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl"
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-5 text-lg font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:shadow-3xl transform hover:scale-105"
              size="lg"
            >
              <CheckCircle className="h-7 w-7 mr-3" />
              Já Paguei
            </Button>
            <p className="text-xs text-gray-600 text-center font-medium">
              ✅ Clique aqui após realizar o pagamento
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MobilePixQrCode;
