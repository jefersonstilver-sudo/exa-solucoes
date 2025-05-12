
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ShoppingCart, Check, CreditCard, Lock } from 'lucide-react';

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
    <div className="flex flex-col sm:flex-row justify-between mt-10 gap-4">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full sm:w-auto"
        >
          {isBackToStore ? (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Voltar para loja
            </>
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </>
          )}
        </Button>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        whileTap={{ scale: isNextEnabled ? 0.95 : 1 }}
      >
        <Button 
          onClick={onNext}
          disabled={!isNextEnabled || isCreatingPayment}
          className={`w-full sm:w-auto transition-all duration-300 ${
            isPaymentStep 
              ? 'bg-green-500 hover:bg-green-600 text-white' 
              : 'bg-indexa-mint hover:bg-indexa-mint-dark text-gray-800'
          }`}
        >
          {isCreatingPayment ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Processando...
            </>
          ) : isPaymentStep ? (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pagar com Mercado Pago
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        
        {isPaymentStep && (
          <motion.div 
            className="text-xs text-center mt-2 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Lock className="inline h-3 w-3 mr-1" />
            Pagamento processado em ambiente seguro
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CheckoutNavigation;
