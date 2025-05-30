
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MobilePixQrCodeProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeBase64?: string;
  qrCodeText?: string;
  amount: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const MobilePixQrCode = ({ 
  isOpen, 
  onClose, 
  qrCodeBase64, 
  qrCodeText, 
  amount,
  onRefresh,
  isRefreshing = false
}: MobilePixQrCodeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!qrCodeText) return;
    
    try {
      await navigator.clipboard.writeText(qrCodeText);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar código PIX');
    }
  };

  const openBankApp = () => {
    // Try to open common bank apps
    const bankApps = [
      'nubank://',
      'itau://',
      'bradesco://',
      'caixa://',
      'santander://',
      'banco-do-brasil://'
    ];
    
    // Try to open first available bank app
    const tryOpenApp = (index: number = 0) => {
      if (index >= bankApps.length) {
        toast.info('Abra o aplicativo do seu banco manualmente');
        return;
      }
      
      const timeout = setTimeout(() => tryOpenApp(index + 1), 1000);
      window.location.href = bankApps[index];
      clearTimeout(timeout);
    };
    
    tryOpenApp();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Pagamento PIX</h2>
                  <p className="text-green-100 text-sm">R$ {amount.toFixed(2)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-green-600 h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* QR Code */}
              <div className="text-center">
                {qrCodeBase64 ? (
                  <div className="bg-white p-4 rounded-xl border-2 border-gray-100 inline-block">
                    <img
                      src={`data:image/png;base64,${qrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm">Gerando QR Code...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-gray-900">Como pagar com PIX</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>1. Escaneie o QR code acima</p>
                  <p>2. Ou copie e cole o código PIX</p>
                  <p>3. Confirme o pagamento no seu banco</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Copy Code Button */}
                {qrCodeText && (
                  <Button
                    onClick={handleCopy}
                    className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-gray-200"
                    disabled={!qrCodeText}
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5 mr-2 text-green-600" />
                        Código Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5 mr-2" />
                        Copiar Código PIX
                      </>
                    )}
                  </Button>
                )}

                {/* Open Bank App Button */}
                <Button
                  onClick={openBankApp}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Abrir App do Banco
                </Button>

                {/* Refresh Button */}
                {onRefresh && (
                  <Button
                    onClick={onRefresh}
                    variant="outline"
                    className="w-full h-12"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar QR Code
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Timer/Status */}
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-800">
                  ⏱️ QR Code válido por mais 10 minutos
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  O pagamento será confirmado automaticamente
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobilePixQrCode;
