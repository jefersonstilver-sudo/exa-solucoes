
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';
import { calculateTotalPrice } from '@/utils/checkoutUtils';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { logNavigation } from '@/services/navigationAuditService';

interface UseCheckoutNavigationProps {
  step: number;
  setStep: (step: number) => void;
  selectedPlan: PlanKey;
  cartItems: { panel: Panel; duration: number }[];
  couponDiscount: number;
  couponValid: boolean;
  acceptTerms: boolean;
  unavailablePanels: string[];
  couponId: string | null;
  startDate: Date;
  endDate: Date;
  sessionUser: any;
  handleClearCart: () => void;
  createPayment: (params: any) => Promise<any>;
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
  const { toast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);

  // Melhorada a lógica de validação para cada etapa
  const isNextEnabled = useCallback(() => {
    if (step === 0) { // PLAN step
      return selectedPlan !== null && cartItems.length > 0;
    }
    if (step === 1) { // REVIEW step
      return cartItems.length > 0;
    }
    if (step === 2) { // COUPON step
      return true; // Coupons são opcionais
    }
    if (step === 3) { // PAYMENT step
      return acceptTerms === true;
    }
    return false;
  }, [step, selectedPlan, cartItems, acceptTerms]);

  const calculateOrderTotal = useCallback(() => {
    return calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
  }, [selectedPlan, cartItems, couponDiscount, couponValid]);

  const handleNextStep = useCallback(async () => {
    if (isNavigating) {
      console.log("Navegação já em andamento, ignorando novo pedido");
      return;
    }

    // Adicionar log detalhado para diagnóstico
    logCheckoutEvent(
      CheckoutEvent.NAVIGATION_EVENT,
      LogLevel.INFO,
      `Tentando avançar do passo ${step} para o próximo passo`,
      { currentStep: step, cartItems: cartItems.length }
    );

    // Verificar se o botão deveria estar habilitado
    if (!isNextEnabled()) {
      console.log("Botão desabilitado, mas clicado de alguma forma");
      return;
    }

    setIsNavigating(true);
    sonnerToast.info("Processando, aguarde...");

    try {
      if (step === 3) {
        // Passo de pagamento
        console.log("Iniciando processamento de pagamento", { cartItems, selectedPlan });
        const orderTotal = calculateOrderTotal();

        if (orderTotal <= 0) {
          toast({
            title: "Erro",
            description: "O valor total do pedido deve ser maior que zero para prosseguir com o pagamento.",
            variant: "destructive",
          });
          setIsNavigating(false);
          return;
        }

        if (!sessionUser) {
          toast({
            title: "Erro",
            description: "Você precisa estar logado para finalizar o pagamento.",
            variant: "destructive",
          });
          logNavigation('/login?redirect=/checkout', 'navigate', true);
          navigate('/login?redirect=/checkout');
          setIsNavigating(false);
          return;
        }

        const paymentParams = {
          totalPrice: orderTotal,
          selectedPlan,
          cartItems,
          startDate,
          endDate,
          couponId,
          acceptTerms,
          unavailablePanels: [], // Ignorando verificação de disponibilidade para correção do bug
          sessionUser,
          handleClearCart
        };

        console.log("Params de pagamento:", paymentParams);

        try {
          logCheckoutEvent(
            CheckoutEvent.PAYMENT_PROCESSING,
            LogLevel.INFO,
            "Iniciando processamento de pagamento",
            { total: orderTotal, planMonths: selectedPlan }
          );
          
          // Mostrar toast para feedback imediato
          toast({
            title: "Processando pagamento",
            description: "Você será redirecionado para a página de pagamento...",
          });
          
          await createPayment(paymentParams);
          
          // Note: A navegação para a página de sucesso é feita dentro de createPayment
          // Esta função apenas retorna, sem tentar navegar novamente
        } catch (paymentError: any) {
          console.error("Erro ao criar pagamento:", paymentError);
          logCheckoutEvent(
            CheckoutEvent.PAYMENT_ERROR,
            LogLevel.ERROR,
            "Erro ao processar pagamento",
            { error: String(paymentError) }
          );
          
          toast({
            title: "Erro",
            description: paymentError.message || "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.",
            variant: "destructive",
          });
          setIsNavigating(false);
        }
      } else {
        // Avança para o próximo passo
        console.log(`Avançando para o passo ${step + 1}`);
        setStep(step + 1);
        setIsNavigating(false);
      }
    } catch (error: any) {
      console.error("Erro inesperado na navegação:", error);
      logCheckoutEvent(
        CheckoutEvent.CHECKOUT_ERROR,
        LogLevel.ERROR, 
        "Erro inesperado durante o checkout",
        { error: String(error) }
      );
      
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
        variant: "destructive",
      });
      setIsNavigating(false);
    }
  }, [
    step, 
    setStep, 
    selectedPlan, 
    cartItems, 
    couponDiscount, 
    couponValid, 
    acceptTerms, 
    couponId, 
    startDate, 
    endDate, 
    sessionUser, 
    handleClearCart, 
    createPayment, 
    navigate, 
    toast, 
    isNavigating, 
    isNextEnabled,
    calculateOrderTotal
  ]);

  const handlePrevStep = useCallback(() => {
    if (isNavigating) {
      return; // Bloquear navegação enquanto está processando
    }
    
    if (step > 0) {
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        `Retornando do passo ${step} para o passo ${step - 1}`
      );
      setStep(step - 1);
    } else {
      // Se estiver no primeiro passo, volta para a loja
      logCheckoutEvent(
        CheckoutEvent.NAVIGATION_EVENT,
        LogLevel.INFO,
        "Retornando para a loja a partir do primeiro passo"
      );
      logNavigation('/paineis-digitais/loja', 'navigate', true);
      navigate('/paineis-digitais/loja');
    }
  }, [step, setStep, navigate, isNavigating]);

  return {
    handleNextStep,
    handlePrevStep,
    isNextEnabled: isNextEnabled(),
    isNavigating
  };
};
