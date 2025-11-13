
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface MobileProgressStepsProps {
  currentStep: number;
}

const MobileProgressSteps: React.FC<MobileProgressStepsProps> = ({ currentStep }) => {
  return (
    <div className="flex sm:hidden justify-center items-center mb-3 px-2">
      <div className="flex items-center space-x-1.5 max-w-full overflow-hidden">
        {PROGRESS_STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          const isVisible = Math.abs(index - currentStep) <= 1;
          
          if (!isVisible) return null;
          
          return (
            <div 
              key={step.name} 
              className="flex items-center"
            >
              {/* Connection Line para mobile */}
              {index > 0 && isVisible && (
                <div className="w-4 h-0.5 mx-1 relative">
                  <div className="h-full bg-gray-200 rounded-full" />
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#3C1361] to-[#3C1361]/80 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: isCompleted ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  />
                </div>
              )}
              
              {/* Step Circle */}
              <motion.div 
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full shadow-md
                  ${isCompleted 
                    ? 'bg-gradient-to-r from-[#3C1361] to-[#3C1361]/90 text-white' 
                    : isCurrent 
                      ? 'bg-[#3C1361] text-white ring-2 ring-[#3C1361]/30' 
                      : 'bg-white text-gray-400 border border-gray-200'
                  }
                `}
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.15 : 1 }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <StepIcon className="w-3 h-3" />
                )}
              </motion.div>
              
              {/* Step Name - Apenas para o atual */}
              {isCurrent && (
                <motion.span 
                  className="text-xs font-bold text-[#3C1361] ml-1.5 whitespace-nowrap"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {step.mobileShort}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileProgressSteps;
