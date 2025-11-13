
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanContinueButtonProps {
  selectedPlan: number | null;
  onContinue: () => void;
  disabled?: boolean;
}

const PlanContinueButton: React.FC<PlanContinueButtonProps> = ({
  selectedPlan,
  onContinue,
  disabled = false
}) => {
  const isDisabled = disabled || !selectedPlan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-2 sm:mt-8 flex justify-center"
    >
      <Button
        onClick={onContinue}
        disabled={isDisabled}
        className="w-full sm:w-auto px-4 sm:px-8 py-2.5 sm:py-4 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedPlan ? (
          <>
            <span className="sm:hidden">Continuar</span>
            <span className="hidden sm:inline">Continuar para Cupom</span>
            <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </>
        ) : (
          <>
            <span className="sm:hidden">Selecione um plano</span>
            <span className="hidden sm:inline">Selecione um plano para continuar</span>
            <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 opacity-50" />
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default PlanContinueButton;
