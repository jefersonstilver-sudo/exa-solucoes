
import React from 'react';
import { motion } from 'framer-motion';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface ProgressHeaderProps {
  currentStep: number;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({ currentStep }) => {
  const progressPercentage = Math.round(((currentStep + 1) / PROGRESS_STEPS.length) * 100);
  const currentStepName = PROGRESS_STEPS[currentStep]?.name || '';

  return (
    <div className="text-center mb-2 sm:mb-3">
      <motion.h3 
        className="text-sm sm:text-base font-semibold text-gray-900 mb-1"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        key={currentStep}
      >
        {currentStepName}
      </motion.h3>
      <p className="text-[10px] sm:text-xs text-gray-600">
        {progressPercentage}% concluído
      </p>
    </div>
  );
};

export default ProgressHeader;
