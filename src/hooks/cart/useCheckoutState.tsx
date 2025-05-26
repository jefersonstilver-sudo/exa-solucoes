
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logMultipleCheckoutAttempt, logCheckoutStart, logCheckoutError } from '@/services/checkoutLogService';

export const useCheckoutState = () => {
  const [isCheckoutProcessed, setIsCheckoutProcessed] = useState(false);
  const { toast } = useToast();

  const preventMultipleCheckout = (): boolean => {
    if (isCheckoutProcessed) {
      logMultipleCheckoutAttempt();
      console.log("Checkout is already being processed, ignoring new attempt");
      toast({
        title: "Processando",
        description: "Seu checkout já está sendo processado, aguarde...",
        variant: "default",
      });
      return false;
    }
    return true;
  };

  const startCheckoutProcess = (itemCount: number) => {
    setIsCheckoutProcessed(true);
    logCheckoutStart(itemCount);
  };

  const resetCheckoutProcess = () => {
    setIsCheckoutProcessed(false);
  };

  const handleCheckoutError = (error: unknown) => {
    logCheckoutError(error);
    console.error("Error during checkout:", error);
    
    toast({
      title: "Erro",
      description: "Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.",
      variant: "destructive",
    });
    
    resetCheckoutProcess();
  };

  const showEmptyCartToast = () => {
    toast({
      title: "Carrinho vazio",
      description: "Adicione painéis ao seu carrinho para completar a compra.",
      variant: "destructive",
    });
  };

  const showAlreadyOnPageToast = () => {
    toast({
      title: "Você já está na página de seleção de plano",
      description: "Continue o processo de checkout.",
      variant: "default",
    });
  };

  return {
    isCheckoutProcessed,
    preventMultipleCheckout,
    startCheckoutProcess,
    resetCheckoutProcess,
    handleCheckoutError,
    showEmptyCartToast,
    showAlreadyOnPageToast
  };
};
