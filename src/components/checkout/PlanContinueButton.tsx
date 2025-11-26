
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
      className="mt-6 sm:mt-8 flex justify-center"
    >
      <Button
        onClick={onContinue}
        disabled={isDisabled}
        className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#9C1E1E] to-[#D72638] hover:from-[#7A1717] hover:to-[#B01F2E] text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
      >
        {selectedPlan ? (
          <>
            <span className="sm:hidden">Continuar</span>
            <span className="hidden sm:inline">Continuar para Cupom</span>
            <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
          </>
        ) : (
          <>
            <span className="sm:hidden">Selecione um plano</span>
            <span className="hidden sm:inline">Selecione um plano para continuar</span>
            <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6 opacity-50" />
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default PlanContinueButton;
