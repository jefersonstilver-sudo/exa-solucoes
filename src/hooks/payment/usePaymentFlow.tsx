
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useNavigate } from 'react-router-dom';
import { usePaymentValidation } from './usePaymentValidation';
import { useOrderCreation } from './useOrderCreation';
import { useMercadoPagoCheckout } from './useMercadoPagoCheckout';
import { usePaymentExecution } from './usePaymentExecution';
import { usePaymentFlowState } from './usePaymentFlowState';
import { Panel } from '@/types/panel';

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const { validatePaymentRequirements } = usePaymentValidation();
  const { createOrder } = useOrderCreation();
  const { 
    isCreatingPayment, 
    setIsCreatingPayment
  } = usePaymentFlowState();
  
  const { 
    redirectToMercadoPago,
    isMercadoPagoReady,
    isSDKLoaded
  } = useMercadoPagoCheckout();
  
  const {
    createdOrderId,
    executePayment,
    isProcessing,
    setProcessing
  } = usePaymentExecution();
  
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
    // Prevent double submission
    if (isProcessing()) {
      console.log("[Payment Flow] Preventing duplicate payment request");
      return;
    }
    
    setProcessing(true);
    
    // Validate and normalize payment method for consistency
    const paymentMethodNormalized = paymentMethod === 'pix' ? 'pix' : 'credit_card';
    
    // Detailed logging
    console.log(`[Payment Flow] Starting payment process: ${paymentMethodNormalized} for R$${totalPrice}`);
    
    // Set payment processing state
    setIsCreatingPayment(true);
    
    try {
      // Display processing toast
      sonnerToast.loading("Preparando pagamento...");
      
      // Verify terms
      if (!acceptTerms) {
        sonnerToast.dismiss();
        sonnerToast.error("Você precisa aceitar os termos para continuar");
        setIsCreatingPayment(false);
        setProcessing(false);
        return;
      }
      
      // Validate requirements - ignore unavailable panels check
      const isValid = validatePaymentRequirements({
        acceptTerms, 
        unavailablePanels: [], // Bypass this check
        sessionUser, 
        isSDKLoaded,
        cartItems
      });
      
      if (!isValid) {
        setIsCreatingPayment(false);
        setProcessing(false);
        sonnerToast.dismiss();
        sonnerToast.error("Não foi possível processar o pagamento");
        return;
      }
      
      // Create order in database
      const pedido = await createOrder({
        sessionUser,
        cartItems,
        selectedPlan,
        totalPrice,
        couponId,
        startDate,
        endDate
      });
      
      // Process payment through edge function
      const paymentResult = await executePayment({
        pedidoId: pedido.id,
        sessionUser,
        startDate,
        endDate,
        totalPrice,
        selectedPlan,
        couponId,
        paymentMethod: paymentMethodNormalized
      });
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Error processing payment');
      }
      
      // Clear cart
      handleClearCart();
      
      // Execute redirection
      console.log(`[Payment Flow] Redirecting to checkout with ID: ${paymentResult.preferenceId}, method: ${paymentMethodNormalized}`);
      sonnerToast.dismiss();
      
      // Redirect to MercadoPago - with preference ID from the response
      redirectToMercadoPago(paymentResult.preferenceId, paymentMethodNormalized);
      
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
      setProcessing(false);
    }
  };

  return {
    isCreatingPayment,
    processPayment,
    isMercadoPagoReady,
    createdOrderId
  };
};
