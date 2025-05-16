
import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { usePaymentFlow } from './usePaymentFlow';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

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
  
  // Log payment method changes
  useEffect(() => {
    console.log(`[Payment] Payment method selected: ${paymentMethod}`);
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Método de pagamento selecionado: ${paymentMethod}`,
      { paymentMethod, timestamp: new Date().toISOString() }
    );
  }, [paymentMethod]);
  
  // Maintain the same interface as before, but with improved logging
  const createPayment = (options: PaymentOptions) => {
    // Verify terms acceptance
    if (!options.acceptTerms) {
      console.error("[Payment] Payment attempted without accepting terms");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Tentativa de pagamento sem aceitar os termos",
        { acceptTerms: options.acceptTerms, timestamp: new Date().toISOString() }
      );
      return;
    }
    
    // Log payment attempt with method
    console.log(`[Payment] Creating payment with method: ${options.paymentMethod || paymentMethod}`);
    
    // Get panel IDs for logging
    const panelIds = options.cartItems.map(item => item.panel.id);
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Iniciando processamento de pagamento via ${options.paymentMethod || paymentMethod}`,
      {
        totalPrice: options.totalPrice, 
        selectedPlan: options.selectedPlan,
        panelCount: options.cartItems.length,
        panelIds: panelIds,
        paymentMethod: options.paymentMethod || paymentMethod
      }
    );
    
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
