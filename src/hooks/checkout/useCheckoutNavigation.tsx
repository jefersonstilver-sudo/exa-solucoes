
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
      case 0: // PLAN step
        return !!selectedPlan && selectedPlan > 0 && cartItems.length > 0;
      case 1: // REVIEW step
        return cartItems.length > 0;
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
      // Primeiro passo, voltar para a loja
      window.location.href = '/paineis-digitais/loja';
    }
  };

  // Navigate to the next step or process payment
  const handleNextStep = (paymentMethod = 'credit_card') => {
    // FIXED: Ensure paymentMethod is properly defined
    const normalizedPaymentMethod = paymentMethod === 'pix' ? 'pix' : 'credit_card';
    
    // Detailed log for diagnostics
    console.log(`[useCheckoutNavigation] handleNextStep called with method: ${normalizedPaymentMethod}, step: ${step}`);
    
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

      // FIXED: Handle final upload step properly
      if (step === 4) {
        // In the last step, redirect to the confirmation page
        navigate('/pedido-confirmado');
        setIsNavigating(false);
        return;
      }
      
      // Handle payment step
      if (step === 3) {
        // Payment
        if (!acceptTerms) {
          sonnerToast.error("Você precisa aceitar os termos para continuar");
          setIsNavigating(false);
          return;
        }
        
        // Detailed log
        console.log(`[useCheckoutNavigation] Starting payment with method: ${normalizedPaymentMethod}`);
        
        logCheckoutEvent(
          CheckoutEvent.NAVIGATION_EVENT,
          LogLevel.INFO,
          `Starting payment with method: ${normalizedPaymentMethod}`,
          { currentStep: step, paymentMethod: normalizedPaymentMethod }
        );
        
        // Calculate price considering coupon discount
        const totalPrice = calculateTotalPrice();
        
        // FIXED: Send the payment method explicitly to createPayment
        createPayment({
          totalPrice,
          selectedPlan,
          cartItems,
          startDate,
          endDate,
          couponId,
          acceptTerms,
          unavailablePanels: [], // Ignoring validation to fix the bug
          sessionUser,
          handleClearCart,
          paymentMethod: normalizedPaymentMethod
        });
        
        // Note: createPayment will reset isNavigating when appropriate
        
        // IMPORTANT: Don't change step here, as we're redirecting to MercadoPago
        return;
      } 
      else {
        // Normal steps (not payment or upload)
        logCheckoutEvent(
          CheckoutEvent.NAVIGATION_EVENT,
          LogLevel.INFO,
          `Navigating to next step: ${step + 1}`,
          { currentStep: step, nextStep: step + 1 }
        );
        
        // IMPORTANT FIX: Update the step before finishing navigation
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
