
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface DesktopProgressStepsProps {
  currentStep: number;
}

const DesktopProgressSteps: React.FC<DesktopProgressStepsProps> = ({ currentStep }) => {
  return (
    <div className="hidden sm:flex justify-between items-center mb-6 px-4">
      {PROGRESS_STEPS.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = currentStep > index;
        const isCurrent = currentStep === index;
        
        return (
          <div 
            key={step.name} 
            className="flex flex-col items-center relative flex-1"
          >
            {/* Connection Line - Centralized and thicker */}
            {index < PROGRESS_STEPS.length - 1 && (
              <div className="absolute top-5 left-1/2 w-full h-1 -translate-y-1/2 z-0">
                <div className="h-full bg-gray-200 rounded-full" />
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#9C1E1E] to-[#D72638] rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: isCompleted ? '100%' : '0%'
                  }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
              </div>
            )}
            
            {/* Step Circle - Larger */}
            <motion.div 
              className={`
                relative z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-md transition-all duration-300
                ${isCompleted 
                  ? 'bg-[#9C1E1E] text-white shadow-[#9C1E1E]/20' 
                  : isCurrent 
                    ? 'bg-[#9C1E1E] text-white ring-4 ring-[#9C1E1E]/20 shadow-lg' 
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                }
              `}
              initial={{ scale: 0.8 }}
              animate={{ scale: isCurrent ? 1.15 : 1 }}
              transition={{ duration: 0.3, type: "spring" }}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" strokeWidth={2.5} />
              ) : (
                <StepIcon className="w-5 h-5" strokeWidth={2} />
              )}
            </motion.div>
            
            {/* Step Info - More legible */}
            <div className="text-center mt-3">
              <span 
                className={`
                  text-sm font-medium block leading-tight
                  ${isCurrent 
                    ? 'text-[#9C1E1E] font-semibold' 
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
