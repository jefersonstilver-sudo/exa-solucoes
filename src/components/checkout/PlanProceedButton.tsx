
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanProceedButtonProps {
  onProceed: () => void;
  disabled: boolean;
}

const PlanProceedButton: React.FC<PlanProceedButtonProps> = ({ 
  onProceed, 
  disabled 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mt-10 flex justify-center"
    >
      <Button 
        size="lg" 
        className="px-8 py-6 bg-indexa-purple hover:bg-indexa-purple/90"
        onClick={onProceed}
        disabled={disabled}
      >
        Continuar com o plano selecionado
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </motion.div>
  );
};

export default PlanProceedButton;
