
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRCodeDisplayProps {
  qrCodeBase64?: string;
  onRegenerate?: () => void;
}

export const QRCodeDisplay = ({ qrCodeBase64, onRegenerate }: QRCodeDisplayProps) => {
  const [imageError, setImageError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  console.log("[QRCodeDisplay] MAPEAMENTO CORRIGIDO - QR code data received:", {
    hasQRCode: !!qrCodeBase64,
    qrCodeLength: qrCodeBase64?.length,
    isDataUrl: qrCodeBase64?.startsWith('data:'),
    isBase64Only: qrCodeBase64 && !qrCodeBase64.startsWith('data:'),
    preview: qrCodeBase64 ? `${qrCodeBase64.substring(0, 50)}...` : 'Not available'
  });
  
  const hasValidQRCode = !!qrCodeBase64 && !imageError;
  
  const handleRetry = async () => {
    setIsRetrying(true);
    setImageError(false);
    setImageLoaded(false);
    
    if (onRegenerate) {
      await onRegenerate();
    }
    
    setTimeout(() => {
      setIsRetrying(false);
    }, 2000);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("[QRCodeDisplay] Erro ao carregar QR code:", {
      error: e,
      imageSrc: (e.target as HTMLImageElement).src?.substring(0, 100) + '...'
    });
    setImageError(true);
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    console.log("[QRCodeDisplay] QR code carregado com sucesso");
    setImageLoaded(true);
    setImageError(false);
  };
  
  if (!qrCodeBase64) {
    return (
      <motion.div 
        className="flex flex-col items-center" 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.3 }}
      >
        <div className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center w-64 h-64 p-6">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-500 text-center mb-4">
            Gerando QR Code PIX...
          </p>
          <div className="h-6 w-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </motion.div>
    );
  }

  if (imageError) {
    return (
      <motion.div 
        className="flex flex-col items-center" 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.3 }}
      >
        <div className="border-2 border-dashed border-red-200 rounded-lg bg-red-50 flex flex-col items-center justify-center w-64 h-64 p-6">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-sm text-red-600 text-center mb-4">
            Erro ao carregar QR Code
          </p>
          {onRegenerate && (
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300"
            >
              {isRetrying ? (
                <>
                  <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Regenerando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    );
  }
  
  // CORREÇÃO: Melhor tratamento do formato do QR Code com validação
  let imageSource = qrCodeBase64;
  
  // CORREÇÃO: Verificar se é base64 válido e adicionar prefixo se necessário
  if (!qrCodeBase64.startsWith('data:')) {
    // Verificar se parece ser base64 válido
    if (qrCodeBase64.match(/^[A-Za-z0-9+/=]+$/)) {
      imageSource = `data:image/png;base64,${qrCodeBase64}`;
      console.log("[QRCodeDisplay] CORREÇÃO: Adicionado prefixo data URL ao base64");
    } else {
      console.warn("[QRCodeDisplay] AVISO: QR Code não parece ser base64 válido:", qrCodeBase64.substring(0, 50));
    }
  }
  
  return (
    <motion.div 
      className="flex flex-col items-center" 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.3 }}
    >
      <div className={`border-2 rounded-lg p-4 shadow-sm relative ${
        imageLoaded 
          ? 'border-green-200 bg-white' 
          : 'border-gray-200 bg-gray-50'
      }`}>
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <img 
          src={imageSource} 
          alt="QR Code PIX" 
          className={`w-56 h-56 rounded-lg transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ display: imageError ? 'none' : 'block' }}
        />
      </div>
      
      {imageLoaded && (
        <motion.div 
          className="mt-3 flex items-center space-x-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-600 font-medium">
            QR Code PIX válido
          </p>
        </motion.div>
      )}
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        📱 Escaneie com o app do seu banco
      </p>
    </motion.div>
  );
};
