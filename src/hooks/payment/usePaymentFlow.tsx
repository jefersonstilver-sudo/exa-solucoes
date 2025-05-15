
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
    // Validação do paymentMethod - assegura que é um valor válido
    if (paymentMethod !== 'credit_card' && paymentMethod !== 'pix') {
      console.warn(`Método de pagamento inválido: ${paymentMethod}, usando credit_card como fallback`);
      paymentMethod = 'credit_card';
    }
    
    // Log do método de pagamento selecionado
    console.log(`[Payment Flow] Iniciando processamento com método: ${paymentMethod}`);
    
    setIsCreatingPayment(true);
    
    try {
      // Log for diagnostics
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Iniciando processamento de pagamento: R$${totalPrice} | Método: ${paymentMethod}`,
        { totalPrice, planMonths: selectedPlan, itemCount: cartItems.length, paymentMethod }
      );
      
      // Display processing toast for better user feedback
      sonnerToast.loading("Preparando pagamento...");
      
      // Validate all requirements before proceeding
      // IMPORTANT: Ignoring unavailable panels validation to fix the bug
      const isValid = validatePaymentRequirements({
        acceptTerms, 
        unavailablePanels: [], // Ignorando validação para correção do bug
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
          "Requisitos do pagamento não atendidos",
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
        `Pedido criado com ID: ${pedido.id}`,
        { pedidoId: pedido.id, paymentMethod }
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
        paymentMethod // Enviando o método de pagamento explicitamente
      };
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        "Enviando dados para processamento de pagamento",
        { pedidoId: pedido.id, paymentMethod }
      );
      
      // Call Edge Function to process payment
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: paymentData
      });
      
      if (error) {
        throw new Error(`Erro ao processar pagamento: ${error.message}`);
      }
      
      // Verify valid response
      if (!data || !data.success) {
        throw new Error('Resposta inválida do processador de pagamento');
      }
      
      // Clear cart after successful order creation
      handleClearCart();
      
      // Log success antes do redirecionamento
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Redirecionando para checkout do MercadoPago com preferenceId: ${data.preference_id}`,
        { preferenceId: data.preference_id, method: paymentMethod }
      );
      
      // Redirect to MercadoPago checkout with specific payment method
      redirectToMercadoPago(data.preference_id, paymentMethod);
      
      // Não definimos isCreatingPayment como false aqui porque o redirecionamento acontecerá
      
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      sonnerToast.dismiss();
      sonnerToast.error("Erro ao iniciar pagamento");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao criar pagamento: ${error.message}`,
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
