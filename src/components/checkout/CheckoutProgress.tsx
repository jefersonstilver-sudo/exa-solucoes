
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface CheckoutProgressProps {
  currentStep: number;
}

const CheckoutProgress: React.FC<CheckoutProgressProps> = ({ currentStep }) => {
  const steps = [
    { name: 'Revisão', icon: '📋' },
    { name: 'Plano', icon: '⏱️' },
    { name: 'Cupom', icon: '🏷️' },
    { name: 'Pagamento', icon: '💳' }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div 
            key={step.name} 
            className="flex flex-col items-center"
          >
            <motion.div 
              className={`
                flex items-center justify-center w-10 h-10 rounded-full 
                ${currentStep > index 
                  ? 'bg-green-100 text-green-600' // Completed
                  : currentStep === index 
                    ? 'bg-indexa-purple text-white' // Current
                    : 'bg-gray-100 text-gray-400' // Upcoming
                }
              `}
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: currentStep === index ? 1 : 0.9,
                backgroundColor: currentStep > index 
                  ? '#DCFCE7' // green-100
                  : currentStep === index 
                    ? '#4E00E8' // indexa-purple
                    : '#F3F4F6' // gray-100
              }}
              transition={{ duration: 0.3 }}
            >
              {currentStep > index ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-lg">{step.icon}</span>
              )}
            </motion.div>
            
            <motion.span 
              className={`
                text-xs mt-2 font-medium
                ${currentStep >= index 
                  ? 'text-gray-700' 
                  : 'text-gray-400'
                }
              `}
              animate={{ 
                color: currentStep >= index ? '#374151' : '#9CA3AF' 
              }}
              transition={{ duration: 0.3 }}
            >
              {step.name}
            </motion.span>
          </div>
        ))}
      </div>
      
      <div className="relative flex items-center justify-between mt-3 px-5">
        {/* Background bar */}
        <div className="absolute w-full h-1 bg-gray-200 rounded"></div>
        
        {/* Progress bar */}
        <motion.div 
          className="absolute h-1 bg-indexa-purple rounded"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        ></motion.div>
      </div>
    </div>
  );
};

export default CheckoutProgress;
