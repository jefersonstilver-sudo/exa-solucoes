
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface QRCodeDisplayProps {
  qrCodeBase64?: string; // Base64 encoded QR code image
}

export const QRCodeDisplay = ({
  qrCodeBase64
}: QRCodeDisplayProps) => {
  // Check if we have a valid QR code
  const hasValidQRCode = !!qrCodeBase64;
  
  // Debug output to see if QR code data is being properly received
  console.log("[QRCodeDisplay] QR code data received:", 
    qrCodeBase64 ? `${qrCodeBase64.substring(0, 30)}...` : 'Not available');
  
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
        <img 
          src={imageSource} 
          alt="QR Code PIX" 
          className="w-64 h-64 rounded-lg" 
          onError={(e) => {
            console.error("[QRCodeDisplay] Error loading QR code image");
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevent infinite loop
            target.alt = "Erro ao carregar QR Code";
            target.className = "w-64 h-64 opacity-50 rounded-lg";
          }}
        />
      ) : (
        <div className="border border-gray-200 rounded-lg bg-white flex flex-col items-center justify-center w-64 h-64">
          <AlertCircle className="h-12 w-12 text-orange-500 mb-2" />
          <p className="text-sm text-gray-500 text-center px-4">
            QR Code não disponível. Tente atualizar o status do pagamento.
          </p>
        </div>
      )}
    </motion.div>
  );
};
