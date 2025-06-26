
import React from 'react';
import { motion } from 'framer-motion';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface ProgressHeaderProps {
  currentStep: number;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({ currentStep }) => {
  // CORREÇÃO: Cálculo correto da porcentagem
  const progressPercentage = Math.round(((currentStep + 1) / PROGRESS_STEPS.length) * 100);
  
  console.log('[ProgressHeader] Debug:', {
    currentStep,
    totalSteps: PROGRESS_STEPS.length,
    progressPercentage,
    currentStepName: PROGRESS_STEPS[currentStep]?.name
  });

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
      <div className="text-xs text-gray-500 mt-1">
        Etapa {currentStep + 1} de {PROGRESS_STEPS.length} - {progressPercentage}% concluído
      </div>
    </motion.div>
  );
};

export default ProgressHeader;
