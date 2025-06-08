
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
  
  // Mapeamento correto dos steps para as rotas
  const stepRoutes = {
    0: '/checkout/cupom',
    1: '/checkout/resumo',
    2: '/checkout', // CORREÇÃO: Agora usa o sistema unificado
    3: '/checkout/finalizar'
  };
  
  // Determine if the next button should be enabled
  const isNextEnabled = useCallback(() => {
    switch (step) {
      case 0: // COUPON step
        return true;
      case 1: // SUMMARY step  
        return cartItems.length > 0 && sessionUser?.id;
      case 2: // UNIFIED CHECKOUT PAYMENT step
        return true;
      case 3: // UPLOAD step
        return true;
      default:
        return false;
    }
  }, [step, cartItems.length, sessionUser?.id]);
  
  // Navigate to the previous step
  const handlePrevStep = useCallback(() => {
    if (step > 0) {
      const prevStep = step - 1;
      const route = stepRoutes[prevStep as keyof typeof stepRoutes];
      if (route) {
        navigate(route);
      }
      setStep(prevStep);
    } else {
      navigate('/selecionar-plano');
    }
  }, [step, navigate, setStep]);

  // CORREÇÃO: Navegação para checkout unificado
  const handleNextStep = useCallback(async (paymentMethod = 'pix') => {
    console.log("[useCheckoutNavigation] UNIFIED - handleNextStep iniciado", {
      step,
      paymentMethod,
      isNavigating,
      sessionUser: !!sessionUser?.id,
      cartItems: cartItems.length
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
      navigate('/login?redirect=/checkout/resumo');
      return;
    }
    
    setIsNavigating(true);
    
    try {
      // Validar se pode prosseguir
      if (!isNextEnabled()) {
        console.warn('[useCheckoutNavigation] Navigation blocked - requirements not met');
        setIsNavigating(false);
        return;
      }

      // CORREÇÃO: Navegação para sistema unificado
      if (step === 1) {
        // Do resumo para checkout unificado
        console.log('[useCheckoutNavigation] Step 1 -> 2 - Navegação para checkout unificado');
        
        if (cartItems.length === 0) {
          sonnerToast.error("Carrinho vazio");
          setIsNavigating(false);
          return;
        }

        if (!selectedPlan) {
          sonnerToast.error("Nenhum plano selecionado");
          setIsNavigating(false);
          return;
        }

        // Navegação para checkout unificado que inicializará o sistema automaticamente
        navigate('/checkout');
        setStep(2);
        setIsNavigating(false);
        return;
      } 
      else {
        // Navegação normal para outros steps
        const nextStep = step + 1;
        const route = stepRoutes[nextStep as keyof typeof stepRoutes];
        
        if (route) {
          navigate(route);
          setStep(nextStep);
        }
        setIsNavigating(false);
      }
    } catch (error) {
      console.error("[useCheckoutNavigation] Error:", error);
      sonnerToast.error("Erro ao processar sua solicitação");
      setIsNavigating(false);
    }
  }, [step, sessionUser?.id, cartItems, selectedPlan, navigate, setStep, isNavigating, isNextEnabled]);

  return {
    handleNextStep,
    handlePrevStep,
    isNextEnabled: isNextEnabled(),
    isNavigating
  };
};
