
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface DesktopProgressStepsProps {
  currentStep: number;
}

const DesktopProgressSteps: React.FC<DesktopProgressStepsProps> = ({ currentStep }) => {
  console.log('[DesktopProgressSteps] Debug:', {
    currentStep,
    steps: PROGRESS_STEPS.map((step, index) => ({
      index,
      name: step.name,
      isCompleted: currentStep > index,
      isCurrent: currentStep === index,
      isPending: currentStep < index
    }))
  });

  return (
    <div className="hidden sm:flex justify-between items-center mb-3 md:mb-4">
      {PROGRESS_STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = currentStep > index;
        const isCurrent = currentStep === index;
        const isPending = currentStep < index;
        
        return (
          <div 
            key={step.name} 
            className="flex flex-col items-center relative flex-1"
          >
            {/* Connection Line */}
            {index < PROGRESS_STEPS.length - 1 && (
              <div className="absolute top-4 md:top-5 left-1/2 w-full h-0.5 -translate-y-1/2 z-0">
                <div className="h-full bg-gray-200 rounded-full" />
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3C1361] to-[#00FFAB] rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: isCompleted ? '100%' : '0%'
                  }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                />
              </div>
            )}
            
            {/* Step Circle */}
            <motion.div 
              className={`
                relative z-10 flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full shadow-lg
                ${isCompleted 
                  ? 'bg-gradient-to-r from-[#3C1361] to-[#00FFAB] text-white' 
                  : isCurrent 
                    ? 'bg-[#3C1361] text-white ring-3 ring-[#00FFAB]/30' 
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                }
              `}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: isCurrent ? 1.1 : 1,
                opacity: 1
              }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.1
              }}
            >
              {isCompleted ? (
                <Check className="w-3 h-3 md:w-4 md:h-4" />
              ) : (
                <StepIcon className="w-3 h-3 md:w-4 md:h-4" />
              )}
            </motion.div>
            
            {/* Step Info */}
            <motion.div 
              className="text-center mt-1 md:mt-2 max-w-[50px] md:max-w-[70px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <span 
                className={`
                  text-xs font-medium block leading-tight
                  ${isCurrent 
                    ? 'text-[#3C1361] font-bold' 
                    : isCompleted 
                      ? 'text-gray-700' 
                      : 'text-gray-400'
                  }
                `}
              >
                {step.shortName}
              </span>
              <span className="text-xs text-gray-500 leading-tight hidden md:block">
                {step.description}
              </span>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default DesktopProgressSteps;
