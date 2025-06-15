
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRCodeDisplayProps {
  qrCodeBase64?: string; // Base64 encoded QR code image
  onRefresh?: () => void;
}

export const QRCodeDisplay = ({
  qrCodeBase64,
  onRefresh
}: QRCodeDisplayProps) => {
  // Check if we have a valid QR code
  const hasValidQRCode = !!qrCodeBase64;
  
  // Debug output to see if QR code data is being properly received
  console.log("[QRCodeDisplay] 🎯 DADOS QR RECEBIDOS:", {
    hasQrCode: hasValidQRCode,
    qrLength: qrCodeBase64?.length || 0,
    preview: qrCodeBase64 ? `${qrCodeBase64.substring(0, 30)}...` : 'Não disponível'
  });
  
  // Check if the base64 string already includes the data URI scheme
  const imageSource = qrCodeBase64 ? 
    (qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`) 
    : '';
  
  return (
    <motion.div 
      className="flex flex-col items-center" 
      initial={{
        opacity: 0,
        scale: 0.9
      }} 
      animate={{
        opacity: 1,
        scale: 1
      }} 
      transition={{
        duration: 0.3
      }}
    >
      {hasValidQRCode ? (
        <div className="relative">
          <img 
            src={imageSource} 
            alt="QR Code PIX" 
            className="w-64 h-64 rounded-lg border-2 border-gray-200 shadow-sm" 
            onError={(e) => {
              console.error("[QRCodeDisplay] ❌ ERRO AO CARREGAR QR CODE");
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop
              target.style.display = 'none';
            }}
            onLoad={() => {
              console.log("[QRCodeDisplay] ✅ QR Code carregado com sucesso");
            }}
          />
          
          {/* Overlay de status */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            QR Code Ativo
          </div>
        </div>
      ) : (
        <div className="border-2 border-gray-200 rounded-lg bg-white flex flex-col items-center justify-center w-64 h-64">
          <AlertCircle className="h-12 w-12 text-orange-500 mb-3" />
          <p className="text-sm text-gray-500 text-center px-4 mb-4">
            QR Code não disponível
          </p>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Gerar QR Code</span>
            </Button>
          )}
        </div>
      )}
      
      {hasValidQRCode && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Escaneie com o app do seu banco
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>PIX instantâneo</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};
