
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface DesktopProgressStepsProps {
  currentStep: number;
}

const DesktopProgressSteps: React.FC<DesktopProgressStepsProps> = ({ currentStep }) => {
  return (
    <div className="hidden sm:flex justify-between items-center mb-3 px-2">
      {PROGRESS_STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = currentStep > index;
        const isCurrent = currentStep === index;
        
        return (
          <div 
            key={step.name} 
            className="flex flex-col items-center relative flex-1"
          >
            {/* Connection Line */}
            {index < PROGRESS_STEPS.length - 1 && (
              <div className="absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 z-0">
                <div className="h-full bg-gray-200 rounded-full" />
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3C1361] to-[#3C1361]/80 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: isCompleted ? '100%' : '0%'
                  }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
              </div>
            )}
            
            {/* Step Circle */}
            <motion.div 
              className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all duration-300
                ${isCompleted 
                  ? 'bg-[#3C1361] text-white' 
                  : isCurrent 
                    ? 'bg-[#3C1361] text-white ring-2 ring-[#3C1361]/30' 
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                }
              `}
              initial={{ scale: 0.8 }}
              animate={{ scale: isCurrent ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <StepIcon className="w-4 h-4" />
              )}
            </motion.div>
            
            {/* Step Info */}
            <div className="text-center mt-2 max-w-[70px]">
              <span 
                className={`
                  text-xs font-medium block leading-tight
                  ${isCurrent 
                    ? 'text-[#3C1361] font-semibold' 
                    : isCompleted 
                      ? 'text-gray-700' 
                      : 'text-gray-400'
                  }
                `}
              >
                {step.shortName}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DesktopProgressSteps;
