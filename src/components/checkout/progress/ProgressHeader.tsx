
import React from 'react';
import { motion } from 'framer-motion';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface ProgressHeaderProps {
  currentStep: number;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({ currentStep }) => {
  const progressPercentage = Math.round(((currentStep + 1) / PROGRESS_STEPS.length) * 100);

  return (
    <div className="text-center mb-2 sm:mb-4">
      <h3 className="text-[10px] sm:text-sm font-semibold text-gray-900 mb-0.5">
        Etapa {currentStep + 1} de {PROGRESS_STEPS.length}
      </h3>
      <p className="text-[9px] sm:text-xs text-gray-600">
        {progressPercentage}% concluído
      </p>
    </div>
  );
};

export default ProgressHeader;
