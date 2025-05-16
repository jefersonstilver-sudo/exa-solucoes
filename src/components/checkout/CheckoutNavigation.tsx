
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
  // Combined value to determine if the button should be disabled
  const isDisabled = !isNextEnabled || isCreatingPayment || isNavigating;
  
  // Text for the "Next" button based on current state
  const getNextButtonText = () => {
    if (isCreatingPayment || isNavigating) {
      return "Processando...";
    }
    if (isPaymentStep) {
      return `Confirmar e pagar ${formatCurrency(totalPrice)}`;
    }
    return "Continuar";
  };

  // Safe function to handle next button click
  const handleNextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Logging for diagnostics
    console.log("Botão próximo clicado. Estado:", {
      isDisabled,
      isNextEnabled,
      isCreatingPayment,
      isNavigating,
      isPaymentStep,
      paymentMethod,
      timestamp: new Date().toISOString()
    });
    
    // If disabled, do nothing
    if (isDisabled) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.WARNING,
        "Clique em botão desabilitado ignorado",
        { isNavigating, isCreatingPayment, isNextEnabled }
      );
      return;
    }
    
    // CRITICAL FIX: Log payment step clicks with more detail
    if (isPaymentStep) {
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Botão de PAGAMENTO clicado: ${totalPrice} - ${paymentMethod}`,
        { 
          isPaymentStep, 
          totalPrice, 
          paymentMethod, 
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          screen: `${window.innerWidth}x${window.innerHeight}`,
          url: window.location.href
        }
      );
      
      // Store in localStorage for diagnostics
      try {
        localStorage.setItem('last_payment_click', new Date().toISOString());
        localStorage.setItem('last_payment_method', paymentMethod || 'unknown');
        localStorage.setItem('last_payment_amount', String(totalPrice));
      } catch (e) {
        console.error("Error storing payment click info:", e);
      }
    } else {
      // Regular navigation event
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        `Botão de próximo passo clicado`,
        { isPaymentStep, totalPrice, paymentMethod }
      );
    }
    
    // Call the event handler
    try {
      onNext();
    } catch (error) {
      console.error("Erro ao processar next:", error);
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao executar onNext: ${error}`,
        { error: String(error), stack: error.stack }
      );
    }
  };

  // Safe function to handle back button click
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
    
    // Log the event
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      `Botão de voltar clicado ${isBackToStore ? '(para loja)' : '(passo anterior)'}`
    );
    
    // Call the event handler
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
