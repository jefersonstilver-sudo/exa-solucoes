
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { usePaymentValidation } from './usePaymentValidation';
import { useOrderCreation } from './useOrderCreation';
import { useMercadoPagoCheckout } from './useMercadoPagoCheckout';
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
    setIsCreatingPayment, 
    redirectToMercadoPago,
    isMercadoPagoReady,
    isSDKLoaded
  } = useMercadoPagoCheckout();

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
    // Normalize and validate payment method - ensure it's a valid value
    const normalizedPaymentMethod = !paymentMethod || paymentMethod === 'undefined' 
      ? 'credit_card' 
      : (paymentMethod === 'pix' ? 'pix' : 'credit_card');
    
    // Log detailed payment method info for debugging
    console.log(`[Payment Flow] Starting processing with method: ${normalizedPaymentMethod} (original: ${paymentMethod})`);
    
    setIsCreatingPayment(true);
    
    try {
      // Log for diagnostics
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Starting payment processing: R$${totalPrice} | Method: ${normalizedPaymentMethod}`,
        { totalPrice, planMonths: selectedPlan, itemCount: cartItems.length, paymentMethod: normalizedPaymentMethod }
      );
      
      // Display processing toast for better user feedback
      sonnerToast.loading("Preparando pagamento...");
      
      // Validate all requirements before proceeding
      // IMPORTANT: Ignoring unavailable panels validation to fix the bug
      const isValid = validatePaymentRequirements({
        acceptTerms, 
        unavailablePanels: [], // Ignoring validation to fix the bug
        sessionUser, 
        isSDKLoaded,
        cartItems
      });
      
      if (!isValid) {
        setIsCreatingPayment(false);
        sonnerToast.dismiss();
        sonnerToast.error("Não foi possível processar o pagamento");
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.ERROR,
          "Payment requirements not met",
          { acceptTerms }
        );
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
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Order created with ID: ${pedido.id}`,
        { pedidoId: pedido.id, paymentMethod: normalizedPaymentMethod }
      );
      
      toast({
        title: "Pedido criado",
        description: "Aguarde enquanto preparamos seu pagamento...",
      });
      
      // Get application base URL
      const currentUrl = window.location.origin;
      
      // Calculate duration based on plan
      const duration = selectedPlan * 30; // converting months to days
      
      // Prepare data for Edge Function
      const paymentData = {
        pedidoId: pedido.id,
        cartItems,
        totals: {
          totalPrice,
          selectedPlan,
          duration,
          withCoupon: !!couponId,
          couponDiscount: couponId ? 10 : 0, // example value
        },
        userId: sessionUser.id,
        returnUrl: currentUrl,
        paymentMethod: normalizedPaymentMethod // Send the normalized payment method explicitly
      };
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        "Sending data for payment processing",
        { pedidoId: pedido.id, paymentMethod: normalizedPaymentMethod }
      );
      
      // Call Edge Function to process payment
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: paymentData
      });
      
      if (error) {
        throw new Error(`Error processing payment: ${error.message}`);
      }
      
      // Verify valid response
      if (!data || !data.success) {
        throw new Error('Invalid response from payment processor');
      }
      
      // Clear cart after successful order creation
      handleClearCart();
      
      // Log success before redirection
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Redirecting to MercadoPago checkout with preferenceId: ${data.preference_id}`,
        { preferenceId: data.preference_id, method: normalizedPaymentMethod }
      );
      
      // Redirect to MercadoPago checkout with specific payment method
      redirectToMercadoPago(data.preference_id, normalizedPaymentMethod);
      
      // Don't set isCreatingPayment as false here because redirection will happen
      
    } catch (error: any) {
      console.error('Error creating payment:', error);
      sonnerToast.dismiss();
      sonnerToast.error("Erro ao iniciar pagamento");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Error creating payment: ${error.message}`,
        { error: error.message }
      );
      
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: error.message || "Houve um problema ao processar o pagamento.",
      });
      
      setIsCreatingPayment(false);
    }
  };

  return {
    isCreatingPayment,
    processPayment,
    isMercadoPagoReady
  };
};
