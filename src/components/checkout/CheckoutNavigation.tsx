
import React from 'react';
import { Button } from '@/components/ui/button';

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
    <div className="flex justify-between mt-10">
      <Button
        variant="outline"
        onClick={onBack}
      >
        {isBackToStore ? 'Voltar para loja' : 'Voltar'}
      </Button>
      <Button 
        onClick={onNext}
        disabled={!isNextEnabled || isCreatingPayment}
        className="bg-indexa-mint hover:bg-indexa-mint-dark text-gray-800"
      >
        {isCreatingPayment ? (
          <>
            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Processando...
          </>
        ) : isPaymentStep ? (
          'Pagar com Mercado Pago'
        ) : (
          'Continuar'
        )}
      </Button>
    </div>
  );
};

export default CheckoutNavigation;
