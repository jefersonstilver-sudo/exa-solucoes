
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProceedButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSending: boolean;
}

const ProceedButton = ({ onClick, disabled, isSending }: ProceedButtonProps) => {
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
        onClick={onClick}
        disabled={disabled || isSending}
      >
        {isSending ? (
          <>
            Registrando plano...
            <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          </>
        ) : (
          <>
            Continuar com o plano selecionado
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default ProceedButton;
