
import React from 'react';
import { motion } from 'framer-motion';

interface QRCodeDisplayProps {
  qrCodeBase64: string; // Base64 encoded QR code image
}

export const QRCodeDisplay = ({ qrCodeBase64 }: QRCodeDisplayProps) => {
  return (
    <motion.div 
      className="flex flex-col items-center space-y-2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-medium text-gray-800">Pague com PIX</h3>
      <p className="text-sm text-gray-500 text-center">Utilize o aplicativo do seu banco para escanear o QR Code</p>
      
      <div className="border border-gray-200 p-4 rounded-lg bg-white">
        <img 
          src={`data:image/png;base64,${qrCodeBase64}`} 
          alt="QR Code PIX" 
          className="w-64 h-64"
        />
      </div>
    </motion.div>
  );
};
