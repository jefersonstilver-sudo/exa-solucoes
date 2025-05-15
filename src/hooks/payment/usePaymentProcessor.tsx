
import { useState } from 'react';
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
  paymentMethod?: string;
}

// This is a wrapper hook that maintains the same interface for backward compatibility
export const usePaymentProcessor = () => {
  const { isCreatingPayment, processPayment, isMercadoPagoReady } = usePaymentFlow();
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  
  // Maintain the same interface as before
  const createPayment = (options: PaymentOptions) => {
    return processPayment({
      ...options,
      paymentMethod: options.paymentMethod || paymentMethod
    });
  };

  return {
    isCreatingPayment,
    createPayment,
    isMercadoPagoReady,
    paymentMethod,
    setPaymentMethod
  };
};
