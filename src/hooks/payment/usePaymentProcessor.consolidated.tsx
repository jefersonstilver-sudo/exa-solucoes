
import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { usePaymentFlow } from './usePaymentFlow';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast as sonnerToast } from 'sonner';
import { CartItem, PaymentResponse } from '@/types/payment';
import { generateOrderPix } from '@/services/asaasPaymentService';


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

interface ProcessPaymentParams {
  pedidoId: string;
  cartItems: CartItem[];
  selectedPlan: number;
  totalPrice: number;
  couponId: string | null;
  sessionUser: any;
  paymentMethod: string;
}

/**
 * CONSOLIDATED Payment Processor Hook
 * This is the ONLY payment processor hook in the system
 * Handles authenticated Asaas PIX payments
 */
export const usePaymentProcessor = () => {
  const { isCreatingPayment, processPayment } = usePaymentFlow();
  const [paymentMethod, setPaymentMethod] = useState<string>('pix');
  
  // Log payment method changes
  useEffect(() => {
    console.log(`[Payment Processor] Payment method selected: ${paymentMethod}`);
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Método de pagamento selecionado: ${paymentMethod}`,
      { paymentMethod, timestamp: new Date().toISOString() }
    );
    
    try {
      sessionStorage.setItem('preferred_payment_method', paymentMethod);
    } catch (e) {
      console.error("Error storing payment method preference:", e);
    }
  }, [paymentMethod]);
  
  // Restore payment method from sessionStorage
  useEffect(() => {
    try {
      const savedMethod = sessionStorage.getItem('preferred_payment_method');
      if (savedMethod && savedMethod === 'pix') {
        setPaymentMethod(savedMethod);
      }
    } catch (e) {
      console.error("Error restoring payment method preference:", e);
    }
  }, []);
  
  /**
   * Main payment creation function
   */
  const createPayment = async (options: PaymentOptions): Promise<PaymentResponse | undefined> => {
    if (!options.acceptTerms) {
      console.error("[Payment Processor] Payment attempted without accepting terms");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Tentativa de pagamento sem aceitar os termos",
        { acceptTerms: options.acceptTerms, timestamp: new Date().toISOString() }
      );
      
      sonnerToast.error("É necessário aceitar os termos para continuar");
      return undefined;
    }
    
    const effectivePaymentMethod = options.paymentMethod || paymentMethod;
    
    console.log(`[Payment Processor] Creating payment with method: ${effectivePaymentMethod}`);
    
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
    
    try {
      sessionStorage.setItem('last_payment_attempt', new Date().toISOString());
      sessionStorage.setItem('last_payment_method', effectivePaymentMethod);
      sessionStorage.setItem('last_payment_amount', String(options.totalPrice));
    } catch (e) {
      console.error("Error storing payment attempt info:", e);
    }
    
    return await processPayment({
      ...options,
      paymentMethod: effectivePaymentMethod
    });
  };

  const processPaymentWithEdgeFunction = async (params: ProcessPaymentParams) => {
    if (params.paymentMethod !== 'pix') throw new Error('Selecione Pix Asaas');
    const data = await generateOrderPix(params.pedidoId, params.sessionUser);
    return { success: true, pedidoId: params.pedidoId, pixData: {
      qrCodeBase64: data.qr_base64, qrCode: data.copia_cola, paymentId: data.payment_id, status: 'PENDING'
    } };
  };

  return {
    isCreatingPayment,
    createPayment,
    processPaymentWithEdgeFunction,
    paymentMethod,
    setPaymentMethod
  };
};
