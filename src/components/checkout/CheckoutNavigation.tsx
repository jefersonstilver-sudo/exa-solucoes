
import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShoppingCart, CreditCard } from 'lucide-react';

interface CheckoutNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isBackToStore: boolean;
  isNextEnabled: boolean;
  isCreatingPayment: boolean;
  isPaymentStep: boolean;
}

const CheckoutNavigation: React.FC<CheckoutNavigationProps> = ({
  onBack,
  onNext,
  isBackToStore,
  isNextEnabled,
  isCreatingPayment,
  isPaymentStep
}) => {
  return (
    <motion.div 
      className="flex flex-col sm:flex-row gap-3 justify-between mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        {isBackToStore ? (
          <>
            <ShoppingCart className="h-4 w-4" />
            <span>Voltar para Loja</span>
          </>
        ) : (
          <span>Voltar</span>
        )}
      </Button>
      
      <Button 
        onClick={onNext}
        disabled={!isNextEnabled || isCreatingPayment}
        className={`gap-2 ${isPaymentStep ? 'bg-green-600 hover:bg-green-700' : 'bg-indexa-purple hover:bg-indexa-purple-dark'}`}
      >
        {isCreatingPayment ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processando...
          </>
        ) : isPaymentStep ? (
          <>
            <CreditCard className="h-4 w-4" />
            <span>Finalizar Pagamento</span>
          </>
        ) : (
          <>
            <span>Continuar</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default CheckoutNavigation;
