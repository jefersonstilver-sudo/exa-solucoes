
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface MobileProgressStepsProps {
  currentStep: number;
}

const MobileProgressSteps: React.FC<MobileProgressStepsProps> = ({ currentStep }) => {
  return (
    <div className="flex sm:hidden justify-evenly items-center mb-4 px-4 py-4 min-h-[60px] bg-gray-50/50 rounded-xl">
      <div className="flex items-center justify-evenly w-full gap-2">
        {PROGRESS_STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;
          
          return (
            <div 
              key={step.name} 
              className="flex items-center flex-1"
            >
              {/* Connection Line - Thicker and more visible */}
              {index > 0 && (
                <div className="w-full h-1 mx-1 relative flex-1">
                  <div className="h-full bg-gray-300 rounded-full" />
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
              
              {/* Step Circle - Larger and more prominent */}
              <motion.div 
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 shadow-sm
                  ${isCompleted 
                    ? 'bg-[#9C1E1E] text-white' 
                    : isCurrent 
                      ? 'bg-[#9C1E1E] text-white ring-2 ring-[#9C1E1E]/30' 
                      : 'bg-white text-gray-400 border-2 border-gray-300'
                  }
                `}
                initial={{ scale: 0.9 }}
                animate={{ scale: isCurrent ? 1.15 : 1 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <StepIcon className="w-4 h-4" strokeWidth={2.5} />
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
