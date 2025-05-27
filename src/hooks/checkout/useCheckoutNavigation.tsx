
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
    0: '/checkout/cupom',
    1: '/checkout/resumo',
    2: '/checkout',
    3: '/checkout/finalizar'
  };
  
  // Determine if the next button should be enabled
  const isNextEnabled = useCallback(() => {
    switch (step) {
      case 0: // COUPON step
        return true;
      case 1: // SUMMARY step  
        return cartItems.length > 0 && sessionUser?.id; // CRITICAL: Require authentication
      case 2: // PAYMENT METHOD SELECTION step
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

  // CRITICAL FIX: Enhanced navigation with proper authentication validation
  const handleNextStep = useCallback(async (paymentMethod = 'pix') => {
    console.log("[useCheckoutNavigation] handleNextStep iniciado", {
      step,
      paymentMethod,
      isNavigating,
      sessionUser: !!sessionUser?.id,
      cartItems: cartItems.length
    });
  
    // CRITICAL: Prevent duplicate navigation
    if (isNavigating) {
      console.warn('[useCheckoutNavigation] Navigation already in progress');
      return;
    }

    // CRITICAL: Validate authentication first
    if (!sessionUser?.id) {
      console.error('[useCheckoutNavigation] User not authenticated');
      sonnerToast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout/resumo');
      return;
    }
    
    setIsNavigating(true);
    
    try {
      // Check if can proceed
      if (!isNextEnabled()) {
        console.warn('[useCheckoutNavigation] Navigation blocked - requirements not met');
        setIsNavigating(false);
        return;
      }

      // CRITICAL FIX: Step 1 (RESUMO) - Create order and navigate to checkout
      if (step === 1) {
        console.log('[useCheckoutNavigation] Step 1 -> 2 - Creating order and navigating to checkout');
        
        // Validate required data
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
          // Calculate total price
          const totalPrice = cartItems.reduce((total, item) => {
            const pricePerPanel = item.panel.buildings?.basePrice || 250;
            return total + pricePerPanel;
          }, 0);

          // Apply coupon discount if valid
          let finalPrice = totalPrice;
          if (couponValid && couponDiscount > 0) {
            const discount = (totalPrice * couponDiscount) / 100;
            finalPrice = totalPrice - discount;
          }

          // Create order using createPayment
          const paymentOptions = {
            sessionUser,
            cartItems,
            selectedPlan,
            totalPrice: finalPrice,
            couponId,
            startDate,
            endDate,
            paymentMethod: 'pix'
          };

          console.log('[useCheckoutNavigation] Creating order with:', paymentOptions);
          
          const result = await createPayment(paymentOptions);
          
          if (result && result.pedidoId) {
            // Success! Navigate to checkout with orderId
            logCheckoutEvent(
              CheckoutEvent.NAVIGATION_EVENT,
              LogLevel.INFO,
              'Order created successfully, navigating to checkout',
              { pedidoId: result.pedidoId, totalPrice: finalPrice }
            );
            
            navigate(`/checkout?id=${result.pedidoId}`);
            setStep(2);
          } else {
            console.error('[useCheckoutNavigation] Invalid result from createPayment:', result);
            sonnerToast.error("Erro ao criar pedido. Tente novamente.");
          }
        } catch (error) {
          console.error('[useCheckoutNavigation] Error creating order:', error);
          sonnerToast.error("Erro ao processar pedido. Tente novamente.");
        }
        
        setIsNavigating(false);
        return;
      } 
      else {
        // Normal navigation for other steps
        const nextStep = step + 1;
        const route = stepRoutes[nextStep as keyof typeof stepRoutes];
        
        if (route) {
          navigate(route);
        }
        setStep(nextStep);
        setIsNavigating(false);
      }
    } catch (error) {
      console.error("[useCheckoutNavigation] Error:", error);
      sonnerToast.error("Erro ao processar sua solicitação");
      setIsNavigating(false);
    }
  }, [step, sessionUser?.id, cartItems, selectedPlan, couponDiscount, couponValid, couponId, startDate, endDate, createPayment, navigate, setStep, isNavigating, isNextEnabled]);

  return {
    handleNextStep,
    handlePrevStep,
    isNextEnabled: isNextEnabled(),
    isNavigating
  };
};
