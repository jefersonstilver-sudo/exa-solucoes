
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
    <div className="hidden sm:flex justify-between items-center mb-2">
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
              <div className="absolute top-3.5 left-1/2 w-full h-0.5 -translate-y-1/2 z-0">
                <div className="h-full bg-gray-200 rounded-full" />
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-[#3C1361] rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: isCompleted ? '100%' : '0%'
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
            
            {/* Step Circle */}
            <div 
              className={`
                relative z-10 flex items-center justify-center w-7 h-7 rounded-full shadow-sm
                ${isCompleted 
                  ? 'bg-[#3C1361] text-white' 
                  : isCurrent 
                    ? 'bg-[#3C1361] text-white' 
                    : 'bg-white text-gray-400 border-2 border-gray-200'
                }
              `}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <StepIcon className="w-3.5 h-3.5" />
              )}
            </div>
            
            {/* Step Info */}
            <div className="text-center mt-1.5 max-w-[60px]">
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
