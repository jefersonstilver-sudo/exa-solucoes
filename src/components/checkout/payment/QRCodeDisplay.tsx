
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRCodeDisplayProps {
  qrCodeBase64?: string;
  onRegenerate?: () => void;
}

export const QRCodeDisplay = ({ qrCodeBase64, onRegenerate }: QRCodeDisplayProps) => {
  const [imageError, setImageError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  console.log("[QRCodeDisplay] CORREÇÃO IMPLEMENTADA - QR code data received:", 
    qrCodeBase64 ? `${qrCodeBase64.substring(0, 100)}...` : 'Not available');
  
  const hasValidQRCode = !!qrCodeBase64 && !imageError;
  
  const handleRetry = async () => {
    setIsRetrying(true);
    setImageError(false);
    
    if (onRegenerate) {
      await onRegenerate();
    }
    
    setTimeout(() => {
      setIsRetrying(false);
    }, 2000);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("[QRCodeDisplay] ERRO DE IMAGEM DETECTADO:", {
      src: e.currentTarget.src,
      format: qrCodeBase64?.substring(0, 30),
      error: e.type
    });
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log("[QRCodeDisplay] ✅ IMAGEM CARREGADA COM SUCESSO!");
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
  
  // CORREÇÃO: Detectar automaticamente o formato (SVG ou PNG)
  let imageSource = qrCodeBase64;
  
  // Se não tem data: no início, assumir que é base64 puro e detectar formato
  if (!qrCodeBase64.startsWith('data:')) {
    // Tentar detectar se é SVG pela presença de tags SVG na string decodificada
    try {
      const decoded = atob(qrCodeBase64);
      if (decoded.includes('<svg') || decoded.includes('xmlns="http://www.w3.org/2000/svg"')) {
        imageSource = `data:image/svg+xml;base64,${qrCodeBase64}`;
        console.log("[QRCodeDisplay] ✅ FORMATO SVG DETECTADO E CORRIGIDO");
      } else {
        imageSource = `data:image/png;base64,${qrCodeBase64}`;
        console.log("[QRCodeDisplay] ✅ FORMATO PNG ASSUMIDO");
      }
    } catch (error) {
      // Se falhar ao decodificar, assumir PNG
      imageSource = `data:image/png;base64,${qrCodeBase64}`;
      console.log("[QRCodeDisplay] ⚠️ FORMATO PNG ASSUMIDO (erro ao decodificar)");
    }
  }
  
  console.log("[QRCodeDisplay] FONTE FINAL DA IMAGEM:", imageSource.substring(0, 50) + "...");
  
  return (
    <motion.div 
      className="flex flex-col items-center" 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="border-2 border-green-200 rounded-lg bg-white p-4 shadow-sm">
        <img 
          src={imageSource} 
          alt="QR Code PIX" 
          className="w-56 h-56 rounded-lg" 
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ 
            display: imageError ? 'none' : 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        📱 Escaneie com o app do seu banco
      </p>
    </motion.div>
  );
};
