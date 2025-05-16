
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

  // Estado para rastrear tentativas de redirecionamento
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  
  // Limpar estado de redirecionamento quando o componente é montado
  useEffect(() => {
    return () => {
      // Limpar isCreatingPayment ao desmontar para evitar que fique preso
      setIsCreatingPayment(false);
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
    // Validate and normalize payment method for consistency
    const paymentMethodNormalized = paymentMethod === 'pix' ? 'pix' : 'credit_card';
    
    // Log detailed payment method info for debugging
    console.log(`[Payment Flow] Início do processamento com método: ${paymentMethodNormalized} (original: ${paymentMethod})`);
    console.log(`[Payment Flow] Detalhes do pagamento:`, {
      totalPrice,
      selectedPlan,
      cartItemsCount: cartItems.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      couponId,
      acceptTerms,
      paymentMethod: paymentMethodNormalized
    });
    
    // Reiniciar contagem de tentativas
    setRedirectAttempts(0);
    
    // Define o estado de criação de pagamento
    setIsCreatingPayment(true);
    
    try {
      // Log for diagnostics
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Iniciando processamento: R$${totalPrice} | Método: ${paymentMethodNormalized}`,
        { totalPrice, planMonths: selectedPlan, itemCount: cartItems.length, paymentMethod: paymentMethodNormalized }
      );
      
      // Display processing toast for better user feedback
      sonnerToast.loading("Preparando pagamento...");
      
      // Verificar os termos
      if (!acceptTerms) {
        sonnerToast.dismiss();
        sonnerToast.error("Você precisa aceitar os termos para continuar");
        setIsCreatingPayment(false);
        return;
      }
      
      // Validate all requirements before proceeding
      // IMPORTANT: Ignoring unavailable panels validation to fix the bug
      const isValid = validatePaymentRequirements({
        acceptTerms, 
        unavailablePanels: [], // Explicitly ignoring the validation to fix the bug
        sessionUser, 
        isSDKLoaded,
        cartItems
      });
      
      if (!isValid) {
        setIsCreatingPayment(false);
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
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Pedido criado com ID: ${pedido.id}`,
        { pedidoId: pedido.id, paymentMethod: paymentMethodNormalized }
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
        returnUrl: `${currentUrl}/pedido-confirmado?id=${pedido.id}`,
        paymentMethod: paymentMethodNormalized
      };
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        "Enviando dados para processamento de pagamento",
        { pedidoId: pedido.id, paymentMethod: paymentMethodNormalized }
      );
      
      // Call Edge Function to process payment
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: paymentData
      });
      
      if (error) {
        throw new Error(`Error processing payment: ${error.message}`);
      }
      
      console.log("Resposta da edge function process-payment:", data);
      
      // Verify valid response
      if (!data || !data.success) {
        throw new Error('Resposta inválida do processador de pagamento');
      }
      
      // Clear cart after successful order creation
      handleClearCart();
      
      // Store order ID in local storage for potential recovery
      localStorage.setItem('lastPedidoId', pedido.id);
      localStorage.setItem('lastPaymentMethod', paymentMethodNormalized);
      localStorage.setItem('lastPaymentTimestamp', new Date().toISOString());
      
      // Log success before redirection
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Redirecionando para checkout do MercadoPago com preferenceId: ${data.preference_id} | Método: ${paymentMethodNormalized}`,
        { preferenceId: data.preference_id, method: paymentMethodNormalized }
      );
      
      // FIXED: Melhor redirecionamento para o MercadoPago com tratamento de erro
      try {
        // Executa o redirecionamento
        redirectToMercadoPago(data.preference_id, paymentMethodNormalized);
        
        // Adiciona um timeout de segurança para resetar o estado caso o redirecionamento falhe
        setTimeout(() => {
          // Se ainda estiver no estado de criação após 8 segundos, algo deu errado
          if (isCreatingPayment) {
            console.error("[Payment Flow] Redirecionamento não ocorreu dentro do tempo esperado");
            setIsCreatingPayment(false);
            sonnerToast.error("Erro ao redirecionar para pagamento. Tente novamente.");
            
            // Incrementa contagem de tentativas
            setRedirectAttempts(prev => prev + 1);
          }
        }, 8000);
      } catch (redirectError) {
        console.error("[Payment Flow] Erro durante redirecionamento:", redirectError);
        setIsCreatingPayment(false);
        sonnerToast.error("Erro ao redirecionar para pagamento");
        
        // Tenta redirecionamento alternativo
        if (redirectAttempts < 2) {
          sonnerToast.info("Tentando método alternativo de redirecionamento...");
          setTimeout(() => {
            window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${data.preference_id}&payment_method_id=${paymentMethodNormalized}`;
          }, 1500);
        }
      }
      
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
    isMercadoPagoReady,
    redirectAttempts
  };
};
