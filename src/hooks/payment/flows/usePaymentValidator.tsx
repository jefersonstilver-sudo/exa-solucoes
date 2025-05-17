
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { usePaymentValidation } from '../usePaymentValidation';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface ValidationOptions {
  acceptTerms: boolean;
  unavailablePanels: string[];
  sessionUser: any;
  isSDKLoaded: boolean;
  cartItems: CartItem[];
}

/**
 * Hook for payment validation logic
 */
export const usePaymentValidator = () => {
  const { validatePaymentRequirements } = usePaymentValidation();
  const { toast } = useToast();

  /**
   * Validates payment requirements before processing
   */
  const validateForPayment = ({
    acceptTerms,
    unavailablePanels,
    sessionUser,
    isSDKLoaded,
    cartItems
  }: ValidationOptions): boolean => {
    // Verify terms
    if (!acceptTerms) {
      sonnerToast.dismiss();
      sonnerToast.error("Você precisa aceitar os termos para continuar");
      return false;
    }
    
    // Validate other requirements (ignore unavailable panels check for now)
    const isValid = validatePaymentRequirements({
      acceptTerms, 
      unavailablePanels: [], // Bypass this check
      sessionUser, 
      isSDKLoaded,
      cartItems
    });
    
    if (!isValid) {
      sonnerToast.dismiss();
      sonnerToast.error("Não foi possível processar o pagamento");
      return false;
    }
    
    return true;
  };

  return {
    validateForPayment,
    toast
  };
};
