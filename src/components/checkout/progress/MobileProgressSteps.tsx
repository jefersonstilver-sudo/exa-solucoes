
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface MobileProgressStepsProps {
  currentStep: number;
}

const MobileProgressSteps: React.FC<MobileProgressStepsProps> = ({ currentStep }) => {
  console.log('[MobileProgressSteps] Debug:', {
    currentStep,
    currentStepName: PROGRESS_STEPS[currentStep]?.name,
    visibleSteps: PROGRESS_STEPS.filter((_, index) => Math.abs(index - currentStep) <= 1)
  });

  return (
    <div className="flex sm:hidden justify-center items-center mb-2 px-1">
      <div className="flex items-center space-x-1 max-w-full overflow-hidden">
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
                <div className="w-3 h-0.5 mx-1 relative">
                  <div className="h-full bg-gray-200 rounded-full" />
                  <motion.div 
                    className="absolute h-0.5 bg-gradient-to-r from-[#3C1361] to-[#00FFAB] rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: isCompleted ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              )}
              
              {/* Step Circle */}
              <motion.div 
                className={`
                  flex items-center justify-center w-5 h-5 rounded-full shadow-md
                  ${isCompleted 
                    ? 'bg-gradient-to-r from-[#3C1361] to-[#00FFAB] text-white' 
                    : isCurrent 
                      ? 'bg-[#3C1361] text-white ring-1 ring-[#00FFAB]/30' 
                      : 'bg-white text-gray-400 border border-gray-200'
                  }
                `}
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.2 : 1 }}
              >
                {isCompleted ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <StepIcon className="w-2.5 h-2.5" />
                )}
              </motion.div>
              
              {/* Step Name - Apenas para o atual */}
              {isCurrent && (
                <motion.span 
                  className="text-xs font-bold text-[#3C1361] ml-1 whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
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
