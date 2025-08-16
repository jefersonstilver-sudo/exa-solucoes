import React from 'react';
import { motion } from 'framer-motion';
import { PROGRESS_STEPS } from './progressStepsConfig';
interface ProgressBarProps {
  currentStep: number;
}
const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep
}) => {
  // CORREÇÃO: Cálculo preciso da porcentagem
  const progressPercentage = (currentStep + 1) / PROGRESS_STEPS.length * 100;
  console.log('[ProgressBar] Debug:', {
    currentStep,
    totalSteps: PROGRESS_STEPS.length,
    progressPercentage: Math.round(progressPercentage)
  });
  return <div className="relative">
      
      
      {/* Progress Text */}
      <motion.div className="text-center mt-1 md:mt-2" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      delay: 0.5
    }}>
        
        <span className="mx-2 text-gray-300 hidden md:inline">•</span>
        
      </motion.div>
    </div>;
};
export default ProgressBar;