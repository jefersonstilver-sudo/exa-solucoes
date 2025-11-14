
import React from 'react';
import { motion } from 'framer-motion';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface ProgressHeaderProps {
  currentStep: number;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({ currentStep }) => {
  const currentStepName = PROGRESS_STEPS[currentStep]?.name || '';

  return (
    <div className="text-center mb-2 sm:mb-3 min-h-[40px] flex flex-col justify-center">
      <motion.h3 
        className="text-base sm:text-lg font-semibold text-gray-900 leading-tight px-2"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        key={currentStep}
      >
        {currentStepName}
      </motion.h3>
    </div>
  );
};

export default ProgressHeader;
