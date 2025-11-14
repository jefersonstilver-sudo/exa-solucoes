
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface MobileProgressStepsProps {
  currentStep: number;
}

const MobileProgressSteps: React.FC<MobileProgressStepsProps> = ({ currentStep }) => {
  return (
    <div className="flex sm:hidden justify-between items-center mb-3 px-1 py-2 min-h-[50px]">
      <div className="flex items-center justify-center space-x-0.5 w-full">
        {PROGRESS_STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          
          return (
            <div 
              key={step.name} 
              className="flex items-center flex-1"
            >
              {/* Connection Line para mobile - mostra todas */}
              {index > 0 && (
                <div className="w-full h-px mx-0.5 relative flex-1">
                  <div className="h-full bg-gray-200 rounded-full" />
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-[#3C1361] rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: isCompleted ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </div>
              )}
              
              {/* Step Circle - Compacto e visível */}
              <motion.div 
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0
                  ${isCompleted 
                    ? 'bg-[#3C1361] text-white' 
                    : isCurrent 
                      ? 'bg-[#3C1361] text-white ring-2 ring-[#3C1361]/20' 
                      : 'bg-gray-200 text-gray-400'
                  }
                `}
                initial={{ scale: 0.9 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" strokeWidth={3} />
                ) : (
                  <StepIcon className="w-3 h-3" strokeWidth={2.5} />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileProgressSteps;
