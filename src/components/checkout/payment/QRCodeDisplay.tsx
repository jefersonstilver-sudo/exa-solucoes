
import React from 'react';
import { motion } from 'framer-motion';

interface QRCodeDisplayProps {
  qrCodeBase64: string; // Changed from base64Image for consistency
}

const QRCodeDisplay = ({ qrCodeBase64 }: QRCodeDisplayProps) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <h3 className="text-lg font-medium text-gray-800">Pague com PIX</h3>
      <p className="text-sm text-gray-500 text-center">Utilize o aplicativo do seu banco para escanear o QR Code</p>
      
      <div className="border border-gray-200 p-4 rounded-lg bg-white">
        {qrCodeBase64 ? (
          <img 
            src={`data:image/png;base64,${qrCodeBase64}`} 
            alt="QR Code PIX" 
            className="w-64 h-64"
          />
        ) : (
          <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
            <p className="text-sm text-gray-500">QR Code não disponível</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeDisplay;
