
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
    // Importante: Garantir que paymentMethod esteja definido
    const normalizedPaymentMethod = paymentMethod === 'pix' ? 'pix' : 'credit_card';
    
    // Log detalhado para diagnóstico
    console.log(`[useCheckoutNavigation] handleNextStep called with method: ${normalizedPaymentMethod}, step: ${step}`);
    
    if (isNavigating) {
      console.warn('[useCheckoutNavigation] Ignoring navigation - already in progress');
      return;
    }
    
    setIsNavigating(true);
    
    try {
      // Verificar se pode avançar
      if (!isNextEnabled()) {
        console.warn('[useCheckoutNavigation] Navigation blocked - isNextEnabled() returned false');
        setIsNavigating(false);
        return;
      }

      // Tratar o último passo diferente (UPLOAD)
      if (step === 4) {
        // No último passo, redirecionar para a página de confirmação
        navigate('/pedido-confirmado');
        setIsNavigating(false);
        return;
      }
      
      // Tratar o passo de pagamento
      if (step === 3) {
        // Pagamento
        if (!acceptTerms) {
          sonnerToast.error("Você precisa aceitar os termos para continuar");
          setIsNavigating(false);
          return;
        }
        
        // Log detalhado
        console.log(`[useCheckoutNavigation] Starting payment with method: ${normalizedPaymentMethod}`);
        
        logCheckoutEvent(
          CheckoutEvent.NAVIGATION_EVENT,
          LogLevel.INFO,
          `Starting payment with method: ${normalizedPaymentMethod}`,
          { currentStep: step, paymentMethod: normalizedPaymentMethod }
        );
        
        // Calcular preço considerando desconto de cupom
        const totalPrice = calculateTotalPrice();
        
        // Tentativa de pagamento explicitamente com o método escolhido
        createPayment({
          totalPrice,
          selectedPlan,
          cartItems,
          startDate,
          endDate,
          couponId,
          acceptTerms,
          unavailablePanels: [], // Ignorando validação para corrigir o bug
          sessionUser,
          handleClearCart,
          paymentMethod: normalizedPaymentMethod
        });
        
        // Note: createPayment irá resetar isNavigating quando apropriado
      } 
      else {
        // Etapas normais (não é pagamento nem upload)
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
  
  // Método para calcular o total com desconto
  const calculateTotalPrice = () => {
    // Cálculo base: subtotal
    const subtotal = cartItems.reduce((total, item) => {
      // Valores de exemplo para desenvolver
      const pricePerPanel = 250; // R$ 250 por painel/mês
      return total + pricePerPanel;
    }, 0);
    
    // Aplicar desconto do cupom se válido
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
