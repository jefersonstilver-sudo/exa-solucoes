
import { Panel } from '@/types/panel';
import { usePaymentFlow } from './usePaymentFlow';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface PaymentOptions {
  totalPrice: number;
  selectedPlan: number;
  cartItems: CartItem[];
  startDate: Date;
  endDate: Date;
  couponId: string | null;
  acceptTerms: boolean;
  unavailablePanels: string[];
  sessionUser: any;
  handleClearCart: () => void;
}

// This is a wrapper hook that maintains the same interface for backward compatibility
export const usePaymentProcessor = () => {
  const { isCreatingPayment, processPayment, isMercadoPagoReady } = usePaymentFlow();
  
  // Maintain the same interface as before
  const createPayment = (options: PaymentOptions) => {
    return processPayment(options);
  };

  return {
    isCreatingPayment,
    createPayment,
    isMercadoPagoReady
  };
};
