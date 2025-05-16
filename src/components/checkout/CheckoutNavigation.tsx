
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCircle, Loader } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface CheckoutNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isBackToStore: boolean;
  isNextEnabled: boolean;
  isCreatingPayment: boolean;
  isPaymentStep: boolean;
  totalPrice?: number;
  isNavigating?: boolean;
  paymentMethod?: string;
}

const CheckoutNavigation: React.FC<CheckoutNavigationProps> = ({
  onBack,
  onNext,
  isBackToStore,
  isNextEnabled,
  isCreatingPayment,
  isPaymentStep,
  totalPrice = 0,
  isNavigating = false,
  paymentMethod
}) => {
  // Valor combinado para determinar se o botão deve estar desabilitado
  const isDisabled = !isNextEnabled || isCreatingPayment || isNavigating;
  
  // Texto para o botão "Próximo" com base no estado atual
  const getNextButtonText = () => {
    if (isCreatingPayment || isNavigating) {
      return "Processando...";
    }
    if (isPaymentStep) {
      return `Confirmar e pagar ${formatCurrency(totalPrice)}`;
    }
    return "Continuar";
  };

  // Função segura para lidar com o clique no botão próximo
  const handleNextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Logging para diagnóstico
    console.log("Botão próximo clicado. Estado:", {
      isDisabled,
      isNextEnabled,
      isCreatingPayment,
      isNavigating,
      isPaymentStep,
      paymentMethod
    });
    
    // Se estiver desabilitado, não fazer nada
    if (isDisabled) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.WARNING,
        "Clique em botão desabilitado ignorado",
        { isNavigating, isCreatingPayment, isNextEnabled }
      );
      return;
    }
    
    // Registrar o evento
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      `Botão de próximo passo clicado ${isPaymentStep ? '(pagamento)' : ''}`,
      { isPaymentStep, totalPrice, paymentMethod }
    );
    
    // Chamar o manipulador de evento
    onNext();
  };

  // Função segura para lidar com o clique no botão voltar
  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isCreatingPayment || isNavigating) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.WARNING,
        "Clique em botão voltar bloqueado durante processamento",
        { isNavigating, isCreatingPayment }
      );
      return;
    }
    
    // Registrar o evento
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      `Botão de voltar clicado ${isBackToStore ? '(para loja)' : '(passo anterior)'}`
    );
    
    // Chamar o manipulador de evento
    onBack();
  };

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
        onClick={handleBackClick}
        className="flex items-center space-x-2 py-6"
        disabled={isCreatingPayment || isNavigating}
        type="button"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>
          {isBackToStore ? 'Voltar para a loja' : 'Voltar'}
        </span>
      </Button>

      <Button
        onClick={handleNextClick}
        disabled={isDisabled}
        size="lg"
        className={`
          py-6 px-8 flex items-center space-x-2
          ${isPaymentStep 
            ? 'bg-[#00FFAB] hover:bg-[#00FFAB]/90 text-[#1E1B4B] font-bold shadow-lg shadow-[#00FFAB]/20 focus:ring-[#00FFAB]' 
            : 'bg-[#1E1B4B] hover:bg-[#1E1B4B]/90'}
          ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''}
          focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all
          hover:scale-[1.02] active:scale-[0.98] transform duration-200
        `}
        type="button"
        data-testid="checkout-next-button"
      >
        {isCreatingPayment || isNavigating ? (
          <>
            <Loader className="h-4 w-4 animate-spin mr-2" />
            <span>Processando...</span>
          </>
        ) : (
          <>
            <span>{getNextButtonText()}</span>
            {isPaymentStep && <CheckCircle className="h-4 w-4 ml-2" />}
          </>
        )}
      </Button>
    </motion.div>
  );
};

export default CheckoutNavigation;
