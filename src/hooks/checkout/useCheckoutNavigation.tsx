
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
      case 1: // PLAN step
        return !!selectedPlan && selectedPlan > 0 && cartItems.length > 0;
      case 2: // REVIEW step
        return cartItems.length > 0;
      case 3: // COUPON step
        return true; // Always enabled as coupon is optional
      case 4: // PAYMENT step
        return acceptTerms;
      default:
        return false;
    }
  };
  
  // Navigate to the previous step
  const handlePrevStep = () => {
    if (step > 1) {
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
    // Importante: Log detalhado do que está acontecendo
    console.log(`[useCheckoutNavigation] handleNextStep called with method: ${paymentMethod}, step: ${step}, isNavigating: ${isNavigating}`);
    
    if (isNavigating) {
      console.warn('[useCheckoutNavigation] Ignoring navigation - already in progress');
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.WARNING,
        "Navigation attempt blocked: navigation already in progress",
        { currentStep: step }
      );
      return;
    }
    
    setIsNavigating(true);
    
    try {
      // Verificar se pode avançar
      if (!isNextEnabled()) {
        console.warn('[useCheckoutNavigation] Navigation blocked - isNextEnabled() returned false');
        
        logCheckoutEvent(
          CheckoutEvent.NAVIGATION_EVENT, 
          LogLevel.WARNING,
          "Navigation blocked: next button disabled",
          { currentStep: step, isAcceptTerms: acceptTerms }
        );
        setIsNavigating(false);
        return;
      }
      
      if (step < 4) {
        // Avançar para o próximo passo (não é o último passo)
        console.log(`[useCheckoutNavigation] Advancing to step ${step + 1}`);
        
        logCheckoutEvent(
          CheckoutEvent.NAVIGATION_EVENT,
          LogLevel.INFO,
          `Navigating to next step: ${step + 1}`,
          { currentStep: step, nextStep: step + 1 }
        );
        
        setStep(step + 1);
        setIsNavigating(false);
      } else {
        // Último passo: processar pagamento
        if (!acceptTerms) {
          console.warn('[useCheckoutNavigation] Payment blocked - terms not accepted');
          sonnerToast.error("Você precisa aceitar os termos para continuar");
          
          logCheckoutEvent(
            CheckoutEvent.NAVIGATION_EVENT,
            LogLevel.WARNING,
            "Payment blocked: terms not accepted",
            { currentStep: step }
          );
          setIsNavigating(false);
          return;
        }
        
        // Important: Save and normalize paymentMethod
        const normalizedPaymentMethod = !paymentMethod || paymentMethod === 'undefined' 
          ? 'credit_card' 
          : paymentMethod;
        
        // Log detalhado da criação de pagamento
        console.log(`[useCheckoutNavigation] Starting payment processing with method: ${normalizedPaymentMethod}`);
        
        logCheckoutEvent(
          CheckoutEvent.NAVIGATION_EVENT,
          LogLevel.INFO,
          `Starting payment processing with method: ${normalizedPaymentMethod}`,
          { currentStep: step, paymentMethod: normalizedPaymentMethod }
        );
        
        // Calcular preço considerando desconto de cupom
        const totalPrice = calculateTotalPrice();
        
        // Tentativa de pagamento - passando explicitamente o método de pagamento
        createPayment({
          totalPrice,
          selectedPlan,
          cartItems,
          startDate,
          endDate,
          couponId,
          acceptTerms,
          unavailablePanels,
          sessionUser,
          handleClearCart,
          paymentMethod: normalizedPaymentMethod // Pass the normalized payment method
        }).finally(() => {
          // A função não seta isNavigating aqui porque o redirect para o Mercado Pago
          // vai acontecer e não queremos resetar o estado de navegação
        });
      }
    } catch (error) {
      console.error("[useCheckoutNavigation] Error during navigation:", error);
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
  
  // Método para calcular o total com desconto
  const calculateTotalPrice = () => {
    // Cálculo base: subtotal
    const subtotal = cartItems.reduce((total, item) => {
      // Valores de exemplo para desenvolver
      const pricePerPanel = 250; // R$ 250 por painel/mês
      return total + pricePerPanel;
    }, 0);
    
    console.log("[useCheckoutNavigation] Calculated subtotal:", subtotal);
    
    // Aplicar desconto do cupom se válido
    let total = subtotal;
    if (couponValid && couponDiscount > 0) {
      const discount = (subtotal * couponDiscount) / 100;
      total = subtotal - discount;
    }
    
    console.log("[useCheckoutNavigation] Total after discounts:", total);
    return total;
  };

  return {
    handleNextStep,
    handlePrevStep,
    isNextEnabled: isNextEnabled(),
    isNavigating
  };
};
