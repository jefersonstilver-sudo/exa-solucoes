
import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { usePaymentFlow } from './usePaymentFlow';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast as sonnerToast } from 'sonner';

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
    
    // Store payment method preference in localStorage for future reference
    try {
      localStorage.setItem('preferred_payment_method', paymentMethod);
    } catch (e) {
      console.error("Error storing payment method preference:", e);
    }
  }, [paymentMethod]);
  
  // Try to restore payment method from localStorage
  useEffect(() => {
    try {
      const savedMethod = localStorage.getItem('preferred_payment_method');
      if (savedMethod && (savedMethod === 'credit_card' || savedMethod === 'pix')) {
        console.log(`[Payment] Restoring saved payment method: ${savedMethod}`);
        setPaymentMethod(savedMethod);
      }
    } catch (e) {
      console.error("Error restoring payment method preference:", e);
    }
  }, []);
  
  // Maintain the same interface as before, but with improved logging
  const createPayment = async (options: PaymentOptions) => {
    // Verify terms acceptance
    if (!options.acceptTerms) {
      console.error("[Payment] Payment attempted without accepting terms");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Tentativa de pagamento sem aceitar os termos",
        { acceptTerms: options.acceptTerms, timestamp: new Date().toISOString() }
      );
      
      sonnerToast.error("É necessário aceitar os termos para continuar");
      return;
    }
    
    // CRITICAL FIX: Ensure payment method is correctly set and passed
    const effectivePaymentMethod = options.paymentMethod || paymentMethod;
    
    // Log payment attempt with method
    console.log(`[Payment] Creating payment with method: ${effectivePaymentMethod}`);
    
    // Get panel IDs for logging
    const panelIds = options.cartItems.map(item => item.panel.id);
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Iniciando processamento de pagamento via ${effectivePaymentMethod}`,
      {
        totalPrice: options.totalPrice, 
        selectedPlan: options.selectedPlan,
        panelCount: options.cartItems.length,
        panelIds: panelIds,
        paymentMethod: effectivePaymentMethod,
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href
      }
    );
    
    // Store payment attempt in localStorage for diagnostics
    try {
      localStorage.setItem('last_payment_attempt', new Date().toISOString());
      localStorage.setItem('last_payment_method', effectivePaymentMethod);
      localStorage.setItem('last_payment_amount', String(options.totalPrice));
    } catch (e) {
      console.error("Error storing payment attempt info:", e);
    }
    
    // CRITICAL FIX: Ensure we await the promise
    try {
      return await processPayment({
        ...options,
        paymentMethod: effectivePaymentMethod
      });
    } catch (error) {
      console.error("[Payment] Error in payment processing:", error);
      sonnerToast.error("Erro ao processar pagamento. Tente novamente.");
      throw error; // Re-throw to allow proper error handling upstream
    }
  };

  return {
    isCreatingPayment,
    createPayment,
    isMercadoPagoReady,
    paymentMethod,
    setPaymentMethod
  };
};
