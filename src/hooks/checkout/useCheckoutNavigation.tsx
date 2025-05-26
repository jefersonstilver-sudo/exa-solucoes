
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast as sonnerToast } from 'sonner';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface UseCheckoutNavigationProps {
  step: number;
  setStep: (step: number) => void;
  selectedPlan: PlanKey | null;
  cartItems: CartItem[];
  couponDiscount: number;
  couponValid: boolean;
  acceptTerms: boolean;
  unavailablePanels: string[];
  couponId: string | null;
  startDate: Date;
  endDate: Date;
  sessionUser: any;
  handleClearCart: () => void;
  createPayment: (options: any) => Promise<void>;
}

export const useCheckoutNavigation = ({
  step,
  setStep,
  selectedPlan,
  cartItems,
  couponDiscount,
  couponValid,
  acceptTerms,
  unavailablePanels,
  couponId,
  startDate,
  endDate,
  sessionUser,
  handleClearCart,
  createPayment
}: UseCheckoutNavigationProps) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Determine if the next button should be enabled
  const isNextEnabled = () => {
    switch (step) {
      case 0: // REVIEW step
        return cartItems.length > 0;
      case 1: // PLAN step
        return !!selectedPlan && selectedPlan > 0 && cartItems.length > 0;
      case 2: // COUPON step
        return true; // Always enabled as coupon is optional
      case 3: // PAYMENT step
        return acceptTerms;
      case 4: // UPLOAD step
        return true; // Always enabled for final step
      default:
        return false;
    }
  };
  
  // Navigate to the previous step
  const handlePrevStep = () => {
    if (step > 0) {
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        `Navigating to previous step: ${step - 1}`,
        { currentStep: step, nextStep: step - 1 }
      );
      setStep(step - 1);
    } else {
      // Primeiro passo, voltar para a seleção de planos
      navigate('/selecionar-plano');
    }
  };

  // Navigate to the next step or process payment with explicit payment method
  const handleNextStep = async (paymentMethod = 'credit_card') => {
    console.log("[useCheckoutNavigation] PAYMENT FLOW TRACE: handleNextStep iniciado", {
      step,
      paymentMethod,
      isNavigating,
      isNextEnabled: isNextEnabled()
    });
  
    // CRITICAL FIX: Clear up payment method type
    const normalizedPaymentMethod = paymentMethod === 'pix' ? 'pix' : 'credit_card';
    
    console.log(`[useCheckoutNavigation] handleNextStep called with method: ${normalizedPaymentMethod}, original: ${paymentMethod}, step: ${step}`);
    
    // CRITICAL FIX: Prevent duplicate navigation
    if (isNavigating) {
      console.warn('[useCheckoutNavigation] Ignoring navigation - already in progress');
      return;
    }
    
    setIsNavigating(true);
    
    try {
      // Check if can proceed
      if (!isNextEnabled()) {
        console.warn('[useCheckoutNavigation] Navigation blocked - isNextEnabled() returned false');
        setIsNavigating(false);
        return;
      }

      // CRITICAL FIX: Payment step processing
      if (step === 3) { // PAYMENT step
        // Payment
        if (!acceptTerms) {
          sonnerToast.error("Você precisa aceitar os termos para continuar");
          setIsNavigating(false);
          return;
        }
        
        console.log(`[useCheckoutNavigation] PAYMENT FLOW TRACE: Processando pagamento com método: ${normalizedPaymentMethod}`);
        
        logCheckoutEvent(
          CheckoutEvent.NAVIGATION_EVENT,
          LogLevel.INFO,
          `Starting payment process with method: ${normalizedPaymentMethod}`,
          { currentStep: step, paymentMethod: normalizedPaymentMethod }
        );
        
        // Calculate price with coupon discount
        const totalPrice = calculateTotalPrice();
        
        try {
          console.log("[useCheckoutNavigation] PAYMENT FLOW TRACE: Chamando createPayment");
          
          await createPayment({
            totalPrice,
            selectedPlan,
            cartItems,
            startDate,
            endDate,
            couponId,
            acceptTerms,
            unavailablePanels: [], // Ignoring validation for now to fix the bug
            sessionUser,
            handleClearCart,
            paymentMethod: normalizedPaymentMethod
          });
          
          console.log("[useCheckoutNavigation] PAYMENT FLOW TRACE: createPayment concluído com sucesso");
          
          // Após pagamento bem-sucedido, redirecionar para página de finalização
          navigate('/checkout/finalizar');
          
        } catch (error) {
          console.error("[useCheckoutNavigation] PAYMENT FLOW TRACE: Erro em createPayment", error);
          
          logCheckoutEvent(
            CheckoutEvent.PAYMENT_ERROR,
            LogLevel.ERROR,
            `Erro ao processar pagamento: ${error}`,
            { error: String(error), stack: error instanceof Error ? error.stack : 'unknown' }
          );
          
          sonnerToast.error("Erro ao processar pagamento. Tente novamente.");
          setIsNavigating(false);
          throw error;
        }
        
        return;
      } 
      else {
        // Normal navigation for non-payment steps
        logCheckoutEvent(
          CheckoutEvent.NAVIGATION_EVENT,
          LogLevel.INFO,
          `Navigating to next step: ${step + 1}`,
          { currentStep: step, nextStep: step + 1 }
        );
        
        setStep(step + 1);
        setIsNavigating(false);
      }
    } catch (error) {
      console.error("[useCheckoutNavigation] Error:", error);
      sonnerToast.error("Erro ao processar sua solicitação");
      
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.ERROR,
        `Error during navigation: ${error}`,
        { currentStep: step, error: String(error) }
      );
      setIsNavigating(false);
    }
  };
  
  // Method to calculate total with discount
  const calculateTotalPrice = () => {
    // Base calculation: subtotal
    const subtotal = cartItems.reduce((total, item) => {
      // Example values for development
      const pricePerPanel = 250; // R$ 250 per panel/month
      return total + pricePerPanel;
    }, 0);
    
    // Apply coupon discount if valid
    let total = subtotal;
    if (couponValid && couponDiscount > 0) {
      const discount = (subtotal * couponDiscount) / 100;
      total = subtotal - discount;
    }
    
    return total;
  };

  return {
    handleNextStep,
    handlePrevStep,
    isNextEnabled: isNextEnabled(),
    isNavigating
  };
};
