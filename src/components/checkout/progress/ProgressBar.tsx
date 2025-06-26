
import React from 'react';
import { motion } from 'framer-motion';
import { PROGRESS_STEPS } from './progressStepsConfig';

interface ProgressBarProps {
  currentStep: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  // CORREÇÃO: Cálculo preciso da porcentagem
  const progressPercentage = ((currentStep + 1) / PROGRESS_STEPS.length) * 100;
  
  console.log('[ProgressBar] Debug:', {
    currentStep,
    totalSteps: PROGRESS_STEPS.length,
    progressPercentage: Math.round(progressPercentage)
  });

  return (
    <div className="relative">
      <div className="w-full h-1 md:h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-[#3C1361] to-[#00FFAB] rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </div>
      
      {/* Progress Text */}
      <motion.div 
        className="text-center mt-1 md:mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-xs text-gray-500">
          Etapa {currentStep + 1} de {PROGRESS_STEPS.length}
        </span>
        <span className="mx-2 text-gray-300 hidden md:inline">•</span>
        <span className="text-xs font-medium text-[#3C1361] hidden md:inline">
          {Math.round(progressPercentage)}% concluído
        </span>
      </motion.div>
    </div>
  );
};

export default ProgressBar;
