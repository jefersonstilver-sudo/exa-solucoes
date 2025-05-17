
import { useState, useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@/types/panel';
import { usePaymentInit } from './flows/usePaymentInit';
import { usePaymentValidator } from './flows/usePaymentValidator';
import { usePaymentProcessor } from './flows/usePaymentProcessor';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface ProcessPaymentOptions {
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

export const usePaymentFlow = () => {
  const navigate = useNavigate();
  
  // Use the new specialized hooks
  const {
    isCreatingPayment, 
    setIsCreatingPayment,
    createdOrderId,
    setCreatedOrderId,
    processingPaymentRef,
    redirectToMercadoPago,
    isMercadoPagoReady,
    isSDKLoaded
  } = usePaymentInit();
  
  const { validateForPayment, toast } = usePaymentValidator();
  
  const {
    createPaymentOrder,
    processPaymentWithEdgeFunction,
    storeCheckoutInfo
  } = usePaymentProcessor();

  // Process payment and manage checkout flow
  const processPayment = async ({
    totalPrice,
    selectedPlan,
    cartItems,
    startDate,
    endDate,
    couponId,
    acceptTerms,
    unavailablePanels,
    sessionUser,
    handleClearCart,
    paymentMethod = 'credit_card'
  }: ProcessPaymentOptions) => {
    // CRITICAL FIX: Prevent double submission
    if (processingPaymentRef.current) {
      console.log("[Payment Flow] Preventing duplicate payment request");
      return;
    }
    
    processingPaymentRef.current = true;
    
    // Validate and normalize payment method for consistency
    const paymentMethodNormalized = paymentMethod === 'pix' ? 'pix' : 'credit_card';
    
    // Detailed logging
    console.log(`[Payment Flow] Starting payment process: ${paymentMethodNormalized} for R$${totalPrice}`);
    
    // Set payment processing state
    setIsCreatingPayment(true);
    
    try {
      // Display processing toast
      sonnerToast.loading("Preparando pagamento...");
      
      // Validation step
      const isValid = validateForPayment({
        acceptTerms,
        unavailablePanels,
        sessionUser,
        isSDKLoaded,
        cartItems
      });
      
      if (!isValid) {
        setIsCreatingPayment(false);
        processingPaymentRef.current = false;
        return;
      }
      
      // Create order in database
      const pedido = await createPaymentOrder({
        sessionUser,
        cartItems,
        selectedPlan,
        totalPrice,
        couponId,
        startDate,
        endDate
      });
      
      // Store order ID
      setCreatedOrderId(pedido.id);
      
      // Process payment with Edge Function
      const { preferenceId, initPoint } = await processPaymentWithEdgeFunction({
        pedidoId: pedido.id,
        cartItems,
        selectedPlan,
        totalPrice,
        couponId,
        sessionUser,
        paymentMethod: paymentMethodNormalized
      });
      
      // Store checkout info in localStorage
      storeCheckoutInfo(pedido.id, paymentMethodNormalized, preferenceId);
      
      // Clear cart
      handleClearCart();
      
      // Execute redirection
      console.log(`[Payment Flow] Redirecting to checkout with ID: ${preferenceId}, method: ${paymentMethodNormalized}`);
      sonnerToast.dismiss();
      
      // Redirect to MercadoPago with preference ID from the response
      redirectToMercadoPago(preferenceId, paymentMethodNormalized);
      
    } catch (error: any) {
      // Comprehensive error handling
      console.error('[Payment Flow] Payment error:', error);
      
      sonnerToast.dismiss();
      sonnerToast.error("Erro ao processar pagamento");
      
      // Log detailed error information
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro no processamento: ${error.message}`,
        { error: String(error), stack: error.stack }
      );
      
      // Display error toast
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: "Ocorreu um problema no processamento. Por favor tente novamente.",
      });
      
      // Reset states
      setIsCreatingPayment(false);
      processingPaymentRef.current = false;
    }
  };

  return {
    isCreatingPayment,
    processPayment,
    isMercadoPagoReady,
    createdOrderId
  };
};
