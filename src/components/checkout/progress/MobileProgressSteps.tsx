
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface MobileProgressStepsProps {
  currentStep: number;
}

const MobileProgressSteps: React.FC<MobileProgressStepsProps> = ({ currentStep }) => {
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
                <div className="w-3 h-px mx-0.5 relative">
                  <div className="h-full bg-gray-300 rounded-full" />
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gray-700 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: isCompleted ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </div>
              )}
              
              {/* Step Circle - Minimalista */}
              <motion.div 
                className={`
                  flex items-center justify-center w-5 h-5 rounded-full
                  ${isCompleted 
                    ? 'bg-gray-700 text-white' 
                    : isCurrent 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }
                `}
                initial={{ scale: 0.9 }}
                animate={{ scale: isCurrent ? 1.05 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? (
                  <Check className="w-2.5 h-2.5" strokeWidth={3} />
                ) : (
                  <StepIcon className="w-2.5 h-2.5" strokeWidth={2.5} />
                )}
              </motion.div>
              
              {/* Step Name - Compacto */}
              {isCurrent && (
                <motion.span 
                  className="text-[10px] font-semibold text-gray-900 ml-1 whitespace-nowrap"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
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
