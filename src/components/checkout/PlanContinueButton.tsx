
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
      className="mt-8 flex justify-center"
    >
      <Button
        onClick={onContinue}
        disabled={isDisabled}
        size="lg"
        className="px-8 py-4 bg-indexa-purple hover:bg-indexa-purple/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedPlan ? (
          <>
            Continuar para Cupom
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        ) : (
          <>
            Selecione um plano para continuar
            <ArrowRight className="ml-2 h-5 w-5 opacity-50" />
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default PlanContinueButton;
