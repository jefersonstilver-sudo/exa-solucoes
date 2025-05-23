
import { useState, useEffect, useRef } from 'react';
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
  
  // Use the specialized hooks
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
      const paymentResult = await processPaymentWithEdgeFunction({
        pedidoId: pedido.id,
        cartItems,
        selectedPlan,
        totalPrice,
        couponId,
        sessionUser,
        paymentMethod: paymentMethodNormalized
      });
      
      // Store checkout info in localStorage
      if (paymentMethodNormalized === 'credit_card') {
        const { preferenceId, initPoint } = paymentResult;
        storeCheckoutInfo(pedido.id, paymentMethodNormalized, preferenceId);
        
        // Clear cart
        handleClearCart();
        
        // Execute redirection for credit card payments
        console.log(`[Payment Flow] Redirecting to MercadoPago checkout with ID: ${preferenceId}`);
        sonnerToast.dismiss();
        
        // IMPORTANT: Store the order ID in localStorage before redirecting
        localStorage.setItem('lastCompletedOrderId', pedido.id);
        
        // Redirect to MercadoPago with preference ID from the response
        redirectToMercadoPago(preferenceId, paymentMethodNormalized);
      } else if (paymentMethodNormalized === 'pix') {
        // For PIX payments, store info and navigate to PIX payment page
        const { pixData, pedidoId } = paymentResult;
        storeCheckoutInfo(pedidoId, paymentMethodNormalized);
        
        // Clear cart
        handleClearCart();
        
        // IMPORTANT: Store the order ID in localStorage before redirecting
        localStorage.setItem('lastCompletedOrderId', pedidoId);
        
        // Navigate to PIX payment page
        console.log('[Payment Flow] Navigating to PIX payment page', { pedidoId });
        sonnerToast.dismiss();
        
        // Redirect to PIX payment page
        navigate(`/pix-payment?pedido=${pedidoId}`);
      }
      
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
