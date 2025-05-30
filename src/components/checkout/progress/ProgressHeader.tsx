
import React from 'react';
import { motion } from 'framer-motion';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface ProgressHeaderProps {
  currentStep: number;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({ currentStep }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-2 md:mb-4"
    >
      <h3 className="text-xs md:text-lg font-semibold text-gray-900 mb-1">
        Progresso do Seu Pedido
      </h3>
      <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
        {PROGRESS_STEPS[currentStep]?.motivationalText || 'Continue para finalizar!'}
      </p>
    </motion.div>
  );
};

export default ProgressHeader;
