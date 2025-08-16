import React from 'react';
import { motion } from 'framer-motion';
import { Building } from 'lucide-react';

interface BusinessLocationPinProps {
  isSelected?: boolean;
  address?: string;
}

const BusinessLocationPin: React.FC<BusinessLocationPinProps> = ({
  isSelected = false,
  address
}) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      whileHover={{ scale: 1.1 }}
      className="relative flex items-center justify-center"
    >
      {/* Pin container */}
      <div className="relative">
        {/* Main pin body */}
        <div 
          className={`
            w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white
            ${isSelected 
              ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse' 
              : 'bg-gradient-to-br from-red-500 to-red-600'
            }
          `}
        >
          <Building className="w-4 h-4 text-white" />
        </div>
        
        {/* Pin point */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-red-600"></div>
        </div>
        
        {/* Pulse animation */}
        {isSelected && (
          <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"></div>
        )}
      </div>
      
      {/* Label */}
      {address && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
        >
          <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold shadow-lg">
            Sua Empresa
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-red-600"></div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BusinessLocationPin;