
import { useState, useCallback } from 'react';
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
  handleClearCart
}: UseCheckoutNavigationProps) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // CORREÇÃO: Mapeamento correto e simplificado das rotas
  const stepRoutes = {
    0: '/selecionar-plano',      // Seleção de plano
    1: '/checkout/cupom',        // Cupom
    2: '/checkout/resumo',       // Resumo
    3: '/checkout',              // Pagamento PIX
    4: '/checkout/finalizar'     // Upload/Finalizar
  };
  
  // Determine if the next button should be enabled
  const isNextEnabled = useCallback(() => {
    switch (step) {
      case 0: // PLAN SELECTION
        return selectedPlan !== null && cartItems.length > 0;
      case 1: // COUPON step
        return true; // Cupom é opcional
      case 2: // SUMMARY step  
        return cartItems.length > 0 && sessionUser?.id;
      case 3: // PAYMENT step - PIX
        return acceptTerms;
      case 4: // UPLOAD step
        return true;
      default:
        return false;
    }
  }, [step, cartItems.length, sessionUser?.id, selectedPlan, acceptTerms]);
  
  // Navigate to the previous step
  const handlePrevStep = useCallback(() => {
    console.log('[useCheckoutNavigation] SISTEMA CORRIGIDO - Navegação anterior:', { currentStep: step });
    
    if (step > 0) {
      const prevStep = step - 1;
      const route = stepRoutes[prevStep as keyof typeof stepRoutes];
      if (route) {
        navigate(route);
        setStep(prevStep);
      }
    } else {
      navigate('/selecionar-plano');
    }
  }, [step, navigate, setStep]);

  // CORREÇÃO: Navegação linear e mais robusta
  const handleNextStep = useCallback(async (paymentMethod = 'pix') => {
    console.log("[useCheckoutNavigation] SISTEMA CORRIGIDO - handleNextStep:", {
      step,
      paymentMethod,
      isNavigating,
      sessionUser: !!sessionUser?.id,
      cartItems: cartItems.length,
      selectedPlan,
      isNextEnabled: isNextEnabled()
    });
  
    // Prevenir navegação dupla
    if (isNavigating) {
      console.warn('[useCheckoutNavigation] Navigation already in progress');
      return;
    }

    // Validar autenticação
    if (!sessionUser?.id) {
      console.error('[useCheckoutNavigation] User not authenticated');
      sonnerToast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    setIsNavigating(true);
    
    try {
      // Validar se pode prosseguir
      if (!isNextEnabled()) {
        console.warn('[useCheckoutNavigation] Navigation blocked - requirements not met');
        
        // Feedback específico baseado no step
        switch (step) {
          case 0:
            sonnerToast.error("Selecione um plano para continuar");
            break;
          case 2:
            sonnerToast.error("Verifique os dados do seu pedido");
            break;
          case 3:
            sonnerToast.error("Aceite os termos para continuar");
            break;
          default:
            sonnerToast.error("Complete os campos obrigatórios");
        }
        
        setIsNavigating(false);
        return;
      }

      // CORREÇÃO: Navegação linear step por step
      const nextStep = step + 1;
      const route = stepRoutes[nextStep as keyof typeof stepRoutes];
      
      if (route) {
        console.log('[useCheckoutNavigation] SISTEMA CORRIGIDO - Navegando para:', route);
        
        // Salvar estado atual
        localStorage.setItem('checkout_step', nextStep.toString());
        localStorage.setItem('checkout_cart', JSON.stringify(cartItems));
        if (selectedPlan) {
          localStorage.setItem('selected_plan', selectedPlan.toString());
        }
        
        // Navegar
        navigate(route);
        setStep(nextStep);
        
        // Feedback visual
        sonnerToast.success("Próxima etapa carregada", { duration: 1500 });
      } else {
        console.error('[useCheckoutNavigation] No route found for step:', nextStep);
        sonnerToast.error("Erro na navegação. Tente novamente.");
      }
      
    } catch (error) {
      console.error("[useCheckoutNavigation] Error:", error);
      sonnerToast.error("Erro ao processar sua solicitação");
    } finally {
      setTimeout(() => {
        setIsNavigating(false);
      }, 1000);
    }
  }, [step, sessionUser?.id, cartItems, selectedPlan, navigate, setStep, isNextEnabled, isNavigating]);

  return {
    handleNextStep,
    handlePrevStep,
    isNextEnabled: isNextEnabled(),
    isNavigating
  };
};
