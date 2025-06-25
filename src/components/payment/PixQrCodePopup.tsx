
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PixQrCodePopupProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeBase64?: string;
  pixCode?: string;
  amount: number;
  expiresAt?: string;
  onRefresh?: () => void;
}

const PixQrCodePopup = ({
  isOpen,
  onClose,
  qrCodeBase64,
  pixCode,
  amount,
  expiresAt,
  onRefresh
}: PixQrCodePopupProps) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [isExpired, setIsExpired] = useState(false);

  // Calculate time left based on expiration
  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiration = new Date(expiresAt).getTime();
      const difference = expiration - now;
      
      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        return;
      }
      
      setTimeLeft(Math.floor(difference / 1000));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyPixCode = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      toast.success('✅ Código PIX copiado!');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <svg viewBox="0 0 512 512" className="h-6 w-6 text-white" fill="currentColor">
                    <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Pagamento PIX
                  </h2>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(amount)}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Timer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl border border-blue-200"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-bold text-blue-800">
                  {isExpired ? 'Expirado' : formatTime(timeLeft)}
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-2 rounded-full ${
                    timeLeft <= 60 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-green-500'
                  }`}
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / 300) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-center text-blue-700 text-sm mt-1">
                Tempo restante para pagamento
              </p>
            </motion.div>

            {/* QR Code */}
            {!isExpired && qrCodeBase64 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-6"
              >
                <div className="bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-2xl border-2 border-blue-200 inline-block">
                  <img
                    src={`data:image/png;base64,${qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-64 h-64 mx-auto rounded-xl"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  📱 Escaneie com o app do seu banco
                </p>
              </motion.div>
            ) : isExpired ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mb-6 p-8"
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-800 mb-4">
                  ⏰ QR Code Expirado
                </h3>
                <p className="text-red-600 mb-6">
                  O tempo para pagamento expirou. Gere um novo QR Code para continuar.
                </p>
                {onRefresh && (
                  <Button
                    onClick={onRefresh}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar Novo QR Code
                  </Button>
                )}
              </motion.div>
            ) : (
              <div className="text-center mb-6 p-8">
                <div className="w-64 h-64 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                  <div className="text-center text-gray-500">
                    <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin" />
                    <p className="text-lg font-medium">Gerando QR Code...</p>
                  </div>
                </div>
              </div>
            )}

            {/* PIX Code */}
            {!isExpired && pixCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    📋 Código PIX (Copia e Cola):
                  </p>
                  <div className="text-xs font-mono text-gray-700 break-all bg-white p-3 rounded-xl border max-h-20 overflow-y-auto">
                    {pixCode}
                  </div>
                </div>
                
                <Button
                  onClick={copyPixCode}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-3 rounded-xl font-semibold text-lg shadow-lg"
                  size="lg"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  Copiar Código PIX
                </Button>
              </motion.div>
            )}

            {/* Instructions */}
            {!isExpired && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200"
              >
                <h3 className="font-semibold text-gray-800 mb-4 text-center">
                  📖 Como pagar:
                </h3>
                <ol className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Abra o app do seu banco ou carteira digital</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Escaneie o QR Code ou cole o código PIX</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Confirme o pagamento</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    <span>Aguarde a confirmação automática</span>
                  </li>
                </ol>
                
                <div className="mt-4 p-3 bg-green-100 rounded-xl border border-green-300">
                  <p className="text-green-800 text-sm font-medium text-center">
                    ✅ O pagamento será confirmado automaticamente em segundos!
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PixQrCodePopup;
