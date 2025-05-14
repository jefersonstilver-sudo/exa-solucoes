import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PlanKey } from '@/types/checkout';
import { Panel } from '@/types/panel';
import { calculateTotalPrice } from '@/utils/checkoutUtils';

// The rest of the original imports would be kept

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

  const isNextEnabled = (() => {
    if (step === 1) {
      return selectedPlan !== null && cartItems.length > 0;
    }
    if (step === 2) {
      return true;
    }
    if (step === 3) {
      return acceptTerms === true;
    }
    return false;
  })();

  const calculateOrderTotal = () => {
    return calculateTotalPrice(selectedPlan, cartItems, couponDiscount, couponValid);
  };

  const handleNextStep = useCallback(async () => {
    if (isNavigating) return;

    setIsNavigating(true);

    try {
      if (step === 3) {
        // Payment Step
        const orderTotal = calculateOrderTotal();

        if (orderTotal <= 0) {
          toast({
            title: "Erro",
            description: "O valor total do pedido deve ser maior que zero para prosseguir com o pagamento.",
            variant: "destructive",
          });
          return;
        }

        const paymentParams = {
          amount: orderTotal,
          couponId: couponId,
          startDate: startDate,
          endDate: endDate,
          userId: sessionUser?.id,
          cartItems: cartItems.map(item => ({
            panelId: item.panel.id,
            duration: item.duration
          }))
        };

        try {
          await createPayment(paymentParams);
          toast({
            title: "Sucesso",
            description: "Pagamento criado com sucesso!",
          });
          handleClearCart();
          navigate('/painel/pedidos');
        } catch (paymentError) {
          console.error("Erro ao criar pagamento:", paymentError);
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.",
            variant: "destructive",
          });
        }
      } else {
        // Move to the next step
        setStep(step + 1);
      }
    } finally {
      setIsNavigating(false);
    }
  }, [step, setStep, selectedPlan, cartItems, couponDiscount, couponValid, acceptTerms, couponId, startDate, endDate, sessionUser, handleClearCart, createPayment, navigate, toast]);

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  return {
    handleNextStep,
    handlePrevStep,
    isNextEnabled
  };
};
