
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCodeBase64?: string;
}

export const QRCodeDisplay = ({ qrCodeBase64 }: QRCodeDisplayProps) => {
  const hasValidQRCode = !!qrCodeBase64;
  
  console.log("[QRCodeDisplay] QR code data received:", 
    qrCodeBase64 ? `${qrCodeBase64.substring(0, 30)}...` : 'Not available');
  
  const imageSource = qrCodeBase64 ? 
    (qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`) 
    : '';
  
  if (!hasValidQRCode) {
    return (
      <motion.div 
        className="flex flex-col items-center" 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.3 }}
      >
        <div className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center w-64 h-64 p-6">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-500 text-center">
            Gerando QR Code PIX...
          </p>
          <div className="mt-4 h-6 w-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="flex flex-col items-center" 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      transition={{ duration: 0.3 }}
    >
      <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-sm">
        <img 
          src={imageSource} 
          alt="QR Code PIX" 
          className="w-56 h-56 rounded-lg" 
          onError={(e) => {
            console.error("[QRCodeDisplay] Error loading QR code image");
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.style.display = 'none';
          }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Escaneie com o app do seu banco
      </p>
    </motion.div>
  );
};
