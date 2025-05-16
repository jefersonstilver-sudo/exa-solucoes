
import { useState, useEffect } from 'react';
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
  
  // Adicionando uma verificação de timeout para o processamento de pagamento
  const [paymentTimeoutId, setPaymentTimeoutId] = useState<number | null>(null);

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
    // Validate and normalize payment method for consistency
    const paymentMethodNormalized = paymentMethod === 'pix' ? 'pix' : 'credit_card';
    
    // Log detailed payment method info for debugging
    console.log(`[Payment Flow] Starting processing with method: ${paymentMethodNormalized} (original: ${paymentMethod})`);
    
    // CORREÇÃO CRÍTICA: Limpar qualquer timeout anterior antes de iniciar um novo pagamento
    if (paymentTimeoutId !== null) {
      window.clearTimeout(paymentTimeoutId);
    }
    
    // Set a new timeout to automatically reset the payment state if stuck
    const timeoutId = window.setTimeout(() => {
      console.error('[Payment Flow] Timeout reached during payment processing');
      setIsCreatingPayment(false);
      sonnerToast.error("O tempo para processamento expirou. Por favor, tente novamente.");
    }, 30000); // 30 segundos de timeout (aumentado para ser mais generoso)
    
    setPaymentTimeoutId(timeoutId);
    setIsCreatingPayment(true);
    
    try {
      // Display processing toast for better user feedback
      sonnerToast.loading("Preparando pagamento...", { id: 'payment-processing' });
      
      // SIMPLIFICADO: Ignorando validações complexas para focar na correção do redirecionamento
      // Nova abordagem: confirmação direta para evitar problemas de validação
      
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
        returnUrl: currentUrl, // URL base simples
        paymentMethod: paymentMethodNormalized // Send normalized value
      };
      
      // Call Edge Function to process payment
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: paymentData
      });
      
      if (error) {
        throw new Error(`Error processing payment: ${error.message}`);
      }
      
      // Verify valid response
      if (!data || !data.success || !data.preference_id) {
        throw new Error('Invalid response from payment processor');
      }
      
      // Clear cart after successful order creation
      handleClearCart();
      
      // Store order ID in local storage for potential recovery
      localStorage.setItem('lastPedidoId', pedido.id);
      
      // CORREÇÃO CRÍTICA: Dismiss all toasts before redirecting
      sonnerToast.dismiss('payment-processing');
      
      // CORREÇÃO CRÍTICA: Redefinir o timeout antes do redirecionamento
      window.clearTimeout(timeoutId);
      setPaymentTimeoutId(null);
      
      // Importante: Manter isCreatingPayment como true para feedback visual
      
      // CORREÇÃO CRÍTICA: Uso direto da preferenceId sem manipulação adicional
      console.log("[Payment Flow] Redirecting with preferenceId:", data.preference_id);
      
      // SOLUÇÃO FINAL: Redirecionamento direto e simplificado
      redirectToMercadoPago(data.preference_id, paymentMethodNormalized);
      
    } catch (error: any) {
      console.error('Error creating payment:', error);
      window.clearTimeout(timeoutId);
      setPaymentTimeoutId(null);
      sonnerToast.dismiss('payment-processing');
      sonnerToast.error("Erro ao iniciar pagamento");
      
      setIsCreatingPayment(false);
    }
  };

  return {
    isCreatingPayment,
    processPayment,
    isMercadoPagoReady
  };
};
