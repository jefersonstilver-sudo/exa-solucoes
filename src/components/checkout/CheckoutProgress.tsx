
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Upload } from 'lucide-react';

interface CheckoutProgressProps {
  currentStep: number;
}

const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ currentStep }) => {
  const steps = [
    { name: 'Revisão', icon: '📋' },
    { name: 'Plano', icon: '⏱️' },
    { name: 'Cupom', icon: '🏷️' },
    { name: 'Pagamento', icon: '💳' },
    { name: 'Upload', icon: '📤' }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        {steps.map((step, index) => (
          <div 
            key={step.name} 
            className="flex flex-col items-center"
          >
            <motion.div 
              className={`
                flex items-center justify-center w-12 h-12 rounded-full shadow-sm
                ${currentStep > index 
                  ? 'bg-[#00FFAB]/20 text-[#00FFAB]' // Completed
                  : currentStep === index 
                    ? 'bg-[#1E1B4B] text-white' // Current
                    : 'bg-gray-100 text-gray-400' // Upcoming
                }
                ${index === 4 && currentStep === 4 ? 'animate-pulse bg-[#1E1B4B]' : ''} // Animação pulsante para etapa Upload
              `}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: currentStep === index ? 1 : 0.9,
                opacity: 1,
                backgroundColor: currentStep > index 
                  ? 'rgba(0, 255, 171, 0.2)' // #00FFAB with 20% opacity
                  : currentStep === index 
                    ? index === 4 ? '#1E1B4B' : '#1E1B4B' 
                    : '#F3F4F6',
                transition: {
                  duration: 0.3,
                  delay: index * 0.1
                }
              }}
            >
              {currentStep > index ? (
                <Check className="w-5 h-5" />
              ) : (
                index === 4 ? <Upload className="w-5 h-5" /> : <span className="text-lg">{step.icon}</span>
              )}
            </motion.div>
            
            <motion.span 
              className={`
                text-xs mt-2 font-medium
                ${currentStep >= index 
                  ? 'text-gray-700' 
                  : 'text-gray-400'
                }
                ${index === 4 && currentStep === 4 ? 'font-bold text-[#1E1B4B]' : ''}
              `}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                color: currentStep >= index ? '#374151' : '#9CA3AF',
                transition: {
                  duration: 0.3,
                  delay: index * 0.1 + 0.1
                }
              }}
            >
              {index === 4 && currentStep === 4 ? 'Começar' : step.name}
            </motion.span>
          </div>
        ))}
      </div>
      
      <div className="relative flex items-center justify-between mt-3 px-6">
        {/* Background bar */}
        <div className="absolute w-full h-1.5 bg-gray-200 rounded-full"></div>
        
        {/* Progress bar */}
        <motion.div 
          className="absolute h-1.5 bg-gradient-to-r from-[#1E1B4B] to-[#00FFAB] rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        ></motion.div>
      </div>
    </div>
  );
};

export default CheckoutProgress;
