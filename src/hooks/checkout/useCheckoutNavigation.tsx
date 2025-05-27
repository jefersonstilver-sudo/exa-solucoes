
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
  
  // CORREÇÃO CRÍTICA: Mapeamento correto dos steps
  const stepRoutes = {
    0: '/checkout/cupom',      // Coupon step
    1: '/checkout/resumo',     // Summary step  
    2: '/checkout',            // Payment METHOD SELECTION step (CRÍTICO!)
    3: '/checkout/finalizar'   // Upload/Finish step
  };
  
  // Determine if the next button should be enabled
  const isNextEnabled = () => {
    switch (step) {
      case 0: // COUPON step
        return true; // Always enabled as coupon is optional
      case 1: // SUMMARY step  
        return cartItems.length > 0;
      case 2: // PAYMENT METHOD SELECTION step
        return true; // Always enabled to allow method selection
      case 3: // UPLOAD step
        return true; // Always enabled for final step
      default:
        return false;
    }
  };
  
  // Navigate to the previous step
  const handlePrevStep = () => {
    if (step > 0) {
      const prevStep = step - 1;
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        `Navigating to previous step: ${prevStep}`,
        { currentStep: step, nextStep: prevStep }
      );
      
      // Navigate to previous route
      const route = stepRoutes[prevStep as keyof typeof stepRoutes];
      if (route) {
        navigate(route);
      }
      setStep(prevStep);
    } else {
      // First step, go back to plan selection
      navigate('/selecionar-plano');
    }
  };

  // CORREÇÃO CRÍTICA: Navigate to the next step SEM processar pagamento no step 2
  const handleNextStep = async (paymentMethod = 'credit_card') => {
    console.log("[useCheckoutNavigation] MEGA CHECKOUT FLOW: handleNextStep iniciado", {
      step,
      paymentMethod,
      isNavigating,
      isNextEnabled: isNextEnabled()
    });
  
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

      // CORREÇÃO MEGA CRÍTICA: NO STEP 2, APENAS NAVEGAR - NÃO PROCESSAR PAGAMENTO!
      if (step === 2) {
        // Step 2 é seleção de método de pagamento, não processamento!
        // O processamento acontece na página /checkout quando o usuário escolhe o método
        console.log('[useCheckoutNavigation] MEGA CHECKOUT: Step 2 - navegando para método de pagamento');
        
        logCheckoutEvent(
          CheckoutEvent.NAVIGATION_EVENT,
          LogLevel.INFO,
          'Navegando para seleção de método de pagamento',
          { currentStep: step, targetRoute: '/checkout' }
        );
        
        // Navegar para a página de seleção de método de pagamento
        navigate('/checkout');
        setStep(2); // Manter no step 2 pois é onde fica a seleção
        setIsNavigating(false);
        return;
      } 
      else {
        // Normal navigation for other steps
        const nextStep = step + 1;
        const route = stepRoutes[nextStep as keyof typeof stepRoutes];
        
        logCheckoutEvent(
          CheckoutEvent.NAVIGATION_EVENT,
          LogLevel.INFO,
          `Navegando para próximo step: ${nextStep}`,
          { currentStep: step, nextStep, route }
        );
        
        if (route) {
          navigate(route);
        }
        setStep(nextStep);
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
    const subtotal = cartItems.reduce((total, item) => {
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
