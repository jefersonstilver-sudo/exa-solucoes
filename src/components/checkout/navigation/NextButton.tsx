
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader } from 'lucide-react';
import { formatCurrency } from '@/utils/priceUtils';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface NextButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isDisabled: boolean;
  isLoading: boolean;
  isPaymentStep: boolean;
  totalPrice?: number;
  paymentMethod?: string;
}

const NextButton: React.FC<NextButtonProps> = ({ 
  onClick, 
  isDisabled, 
  isLoading, 
  isPaymentStep, 
  totalPrice = 0,
  paymentMethod
}) => {
  // Text for the "Next" button based on current state
  const getNextButtonText = () => {
    if (isLoading) {
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
    
    // ENHANCED DEBUGGING: Add extended logging to trace payment flow
    console.log("[NextButton] PAYMENT FLOW TRACE: Botão clicado", { 
      isDisabled,
      isLoading,
      isPaymentStep,
      paymentMethod,
      totalPrice,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
      referrer: document.referrer
    });
    
    // If disabled, do nothing
    if (isDisabled) {
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.WARNING,
        "Clique em botão desabilitado ignorado",
        { isLoading, isDisabled }
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
      
      // Anti-bounce mechanism to prevent double clicks
      const btn = e.currentTarget as HTMLButtonElement;
      btn.disabled = true;
      setTimeout(() => {
        if (btn && document.body.contains(btn)) {
          btn.disabled = false;
        }
      }, 2000);
    } else {
      // Regular navigation event
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        `Botão de próximo passo clicado`,
        { isPaymentStep, totalPrice, paymentMethod }
      );
    }
    
    // CRITICAL FIX: Use try-catch with proper error logging
    try {
      console.log("[NextButton] PAYMENT FLOW TRACE: Chamando onClick handler");
      onClick(e);
      console.log("[NextButton] PAYMENT FLOW TRACE: onClick handler executado com sucesso");
    } catch (error: any) {
      console.error("PAYMENT ERROR - Erro ao processar next:", error);
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao executar onClick: ${error}`,
        { 
          error: String(error), 
          stack: error.stack, 
          component: 'NextButton' 
        }
      );
    }
  };

  return (
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
      {isLoading ? (
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
  );
};

export default NextButton;
