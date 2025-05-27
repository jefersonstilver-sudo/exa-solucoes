
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
  createPayment: (options: any) => Promise<any>;
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
  
  // Mapeamento correto dos steps para as rotas
  const stepRoutes = {
    0: '/checkout/cupom',      // Coupon step
    1: '/checkout/resumo',     // Summary step  
    2: '/checkout',            // Payment METHOD SELECTION step
    3: '/checkout/finalizar'   // Upload/Finish step
  };
  
  // Determine if the next button should be enabled
  const isNextEnabled = () => {
    switch (step) {
      case 0: // COUPON step
        return true; // Always enabled as coupon is optional
      case 1: // SUMMARY step  
        return cartItems.length > 0 && !!sessionUser;
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

  // CORREÇÃO CRÍTICA: Navigate to the next step com validação de autenticação
  const handleNextStep = async (paymentMethod = 'credit_card') => {
    console.log("[useCheckoutNavigation] CORREÇÃO DEFINITIVA: handleNextStep iniciado", {
      step,
      paymentMethod,
      isNavigating,
      isNextEnabled: isNextEnabled(),
      hasUser: !!sessionUser
    });
  
    // CRITICAL FIX: Prevent duplicate navigation
    if (isNavigating) {
      console.warn('[useCheckoutNavigation] Ignoring navigation - already in progress');
      return;
    }
    
    setIsNavigating(true);
    
    try {
      // VALIDAÇÃO CRÍTICA DE AUTENTICAÇÃO
      if (!sessionUser?.id) {
        console.error('[useCheckoutNavigation] Usuário não autenticado');
        sonnerToast.error("Você precisa estar logado para continuar");
        navigate('/login?redirect=/checkout/resumo');
        setIsNavigating(false);
        return;
      }

      // Check if can proceed
      if (!isNextEnabled()) {
        console.warn('[useCheckoutNavigation] Navigation blocked - isNextEnabled() returned false');
        setIsNavigating(false);
        return;
      }

      // CORREÇÃO DEFINITIVA: NO STEP 1 (RESUMO), CRIAR PEDIDO E NAVEGAR PARA CHECKOUT
      if (step === 1) {
        console.log('[useCheckoutNavigation] CORREÇÃO: Step 1 -> 2 - criando pedido e navegando para checkout');
        
        // Validar dados necessários
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

        try {
          // Calcular preço total
          const totalPrice = cartItems.reduce((total, item) => {
            const pricePerPanel = item.panel.buildings?.basePrice || 250;
            return total + pricePerPanel;
          }, 0);

          // Aplicar desconto do cupom se válido
          let finalPrice = totalPrice;
          if (couponValid && couponDiscount > 0) {
            const discount = (totalPrice * couponDiscount) / 100;
            finalPrice = totalPrice - discount;
          }

          // Criar o pedido usando createPayment
          const paymentOptions = {
            sessionUser,
            cartItems,
            selectedPlan,
            totalPrice: finalPrice,
            couponId,
            startDate,
            endDate,
            paymentMethod: 'pix' // Default para PIX
          };

          console.log('[useCheckoutNavigation] Criando pedido com:', paymentOptions);
          
          const result = await createPayment(paymentOptions);
          
          if (result && result.pedidoId) {
            // Sucesso! Navegar para checkout com orderId
            logCheckoutEvent(
              CheckoutEvent.NAVIGATION_EVENT,
              LogLevel.INFO,
              'Pedido criado com sucesso, navegando para checkout',
              { pedidoId: result.pedidoId, totalPrice: finalPrice }
            );
            
            navigate(`/checkout?id=${result.pedidoId}`);
            setStep(2);
          } else {
            console.error('[useCheckoutNavigation] Resultado inválido do createPayment:', result);
            sonnerToast.error("Erro ao criar pedido. Tente novamente.");
          }
        } catch (error) {
          console.error('[useCheckoutNavigation] Erro ao criar pedido:', error);
          sonnerToast.error("Erro ao processar pedido. Tente novamente.");
        }
        
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

  return {
    handleNextStep,
    handlePrevStep,
    isNextEnabled: isNextEnabled(),
    isNavigating
  };
};
