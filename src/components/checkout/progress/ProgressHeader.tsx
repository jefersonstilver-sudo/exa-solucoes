
import React from 'react';
import { motion } from 'framer-motion';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface ProgressHeaderProps {
  currentStep: number;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({ currentStep }) => {
  const currentStepName = PROGRESS_STEPS[currentStep]?.name || '';

  return (
    <div className="text-center mb-2 sm:mb-4 min-h-[40px] flex flex-col justify-center">
      <motion.h3 
        className="text-base sm:text-xl font-bold text-gray-900 leading-tight px-2 mb-0.5"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        key={currentStep}
      >
        {currentStepName}
      </motion.h3>
      <motion.p
        className="text-xs sm:text-sm text-[#9C1E1E] font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Passo {currentStep + 1} de {PROGRESS_STEPS.length}
      </motion.p>
    </div>
  );
};

export default ProgressHeader;
