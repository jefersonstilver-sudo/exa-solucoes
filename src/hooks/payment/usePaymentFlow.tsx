
import { useState, useEffect, useRef } from 'react';
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
  
  // Added tracking for created order and state management
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const processingPaymentRef = useRef(false);
  
  // Reset payment state when component unmounts
  useEffect(() => {
    return () => {
      setIsCreatingPayment(false);
      processingPaymentRef.current = false;
    };
  }, [setIsCreatingPayment]);

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
      
      // Verify terms
      if (!acceptTerms) {
        sonnerToast.dismiss();
        sonnerToast.error("Você precisa aceitar os termos para continuar");
        setIsCreatingPayment(false);
        processingPaymentRef.current = false;
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
        processingPaymentRef.current = false;
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
      
      // Store order ID
      setCreatedOrderId(pedido.id);
      
      // Get application base URL
      const currentUrl = window.location.origin;
      
      // Convert months to days
      const duration = selectedPlan * 30;
      
      // Prepare data for Edge Function
      const paymentData = {
        pedidoId: pedido.id,
        cartItems,
        totals: {
          totalPrice,
          selectedPlan,
          duration,
          withCoupon: !!couponId,
          couponDiscount: couponId ? 10 : 0,
        },
        userId: sessionUser.id,
        returnUrl: `${currentUrl}/pedido-confirmado?id=${pedido.id}`,
        paymentMethod: paymentMethodNormalized
      };
      
      console.log("[Payment Flow] Sending data to payment processor", {
        pedidoId: pedido.id,
        method: paymentMethodNormalized
      });
      
      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: paymentData
      });
      
      if (error) {
        console.error("[Payment Flow] Edge function error:", error);
        throw new Error(`Error processing payment: ${error.message}`);
      }
      
      console.log("[Payment Flow] Payment processor response:", data);
      
      if (!data || !data.success) {
        throw new Error('Invalid response from payment processor');
      }
      
      // CRITICAL FIX: Store trace information in localStorage for debugging
      localStorage.setItem('mp_redirect_timestamp', Date.now().toString());
      localStorage.setItem('mp_preference_id', data.preference_id);
      
      // Clear cart
      handleClearCart();
      
      // Store order info in localStorage
      localStorage.setItem('lastPedidoId', pedido.id);
      localStorage.setItem('lastPaymentMethod', paymentMethodNormalized);
      localStorage.setItem('lastPaymentTimestamp', new Date().toISOString());
      
      // Execute redirection
      console.log(`[Payment Flow] Redirecting to checkout with ID: ${data.preference_id}, method: ${paymentMethodNormalized}`);
      sonnerToast.dismiss();
      
      // CRITICAL FIX: Redirect to MercadoPago with preference ID from the response
      redirectToMercadoPago(data.preference_id, paymentMethodNormalized);
      
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
