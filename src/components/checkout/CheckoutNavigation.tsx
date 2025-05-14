
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCircle, Loader } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';

interface CheckoutNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isBackToStore: boolean;
  isNextEnabled: boolean;
  isCreatingPayment: boolean;
  isPaymentStep: boolean;
  totalPrice?: number;
}

const CheckoutNavigation: React.FC<CheckoutNavigationProps> = ({
  onBack,
  onNext,
  isBackToStore,
  isNextEnabled,
  isCreatingPayment,
  isPaymentStep,
  totalPrice = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="mt-12 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0"
    >
      <Button
        variant="outline"
        size="lg"
        onClick={onBack}
        className="flex items-center space-x-2 py-6"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>
          {isBackToStore ? 'Voltar para a loja' : 'Voltar'}
        </span>
      </Button>

      <Button
        onClick={onNext}
        disabled={!isNextEnabled || isCreatingPayment}
        size="lg"
        className={`
          py-6 px-8 flex items-center space-x-2
          ${isPaymentStep 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-[#1E1B4B] hover:bg-[#1E1B4B]/90'}
        `}
      >
        {isCreatingPayment ? (
          <>
            <Loader className="h-4 w-4 animate-spin" />
            <span>Processando...</span>
          </>
        ) : (
          <>
            <span>
              {isPaymentStep 
                ? `Confirmar e pagar ${formatCurrency(totalPrice)}` 
                : 'Continuar'}
            </span>
            {isPaymentStep && <CheckCircle className="h-4 w-4 ml-2" />}
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default CheckoutNavigation;
