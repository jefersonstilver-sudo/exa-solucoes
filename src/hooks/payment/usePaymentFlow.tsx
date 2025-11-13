
import { useState, useRef } from 'react';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@/types/panel';
import { usePaymentValidator } from './flows/usePaymentValidator';
import { usePaymentProcessor } from './flows/usePaymentProcessor';
import { unwrapData } from '@/utils/supabaseUtils';

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
  
  // Local state management (replaces usePaymentInit)
  const [isCreatingPayment, setIsCreatingPayment] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const processingPaymentRef = useRef(false);
  
  const { validateForPayment, toast } = usePaymentValidator();
  
  const {
    createPaymentOrder,
    processStripeCheckout
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
      
      // Validation step (removed isSDKLoaded - not needed for Stripe)
      const isValid = validateForPayment({
        acceptTerms,
        unavailablePanels,
        sessionUser,
        isSDKLoaded: true, // Always true for Stripe
        cartItems
      });
      
      if (!isValid) {
        setIsCreatingPayment(false);
        processingPaymentRef.current = false;
        return;
      }
      
      // Create order in database
      let pedidoResult;
      try {
        pedidoResult = await createPaymentOrder({
          sessionUser,
          cartItems,
          selectedPlan,
          totalPrice,
          couponId,
          startDate,
          endDate
        });
      } catch (orderError: any) {
        console.error('[Payment Flow] Order creation error:', orderError);
        
        // 🆕 FASE 3: Mensagens específicas para erros conhecidos
        if (orderError.message?.includes('não estão mais disponíveis')) {
          sonnerToast.dismiss();
          sonnerToast.error(orderError.message, {
            duration: 7000,
            action: {
              label: "Recarregar Loja",
              onClick: () => navigate('/paineis-digitais/loja')
            }
          });
        } else if (orderError.message?.includes('carrinho foi limpo')) {
          sonnerToast.dismiss();
          sonnerToast.error(orderError.message, {
            duration: 7000,
            action: {
              label: "Ir para Loja",
              onClick: () => navigate('/paineis-digitais/loja')
            }
          });
        } else {
          sonnerToast.dismiss();
          sonnerToast.error("Erro ao processar pagamento: " + orderError.message);
        }
        
        setIsCreatingPayment(false);
        processingPaymentRef.current = false;
        return;
      }
      
      // Ensure we have a valid order with type assertion
      const pedido = unwrapData(pedidoResult);
      if (!pedido) {
        throw new Error("Falha ao criar pedido: dados inválidos retornados");
      }
      
      // Type assertion for safer access
      const pedidoTyped = pedido as any;
      
      // Store order ID
      setCreatedOrderId(pedidoTyped.id);
      
      // ✅ VERIFICAR MÉTODO DE PAGAMENTO
      if (paymentMethodNormalized === 'pix') {
        // 💚 PIX: Navegar para página de QR Code (MercadoPago)
        console.log("[Payment Flow] Navigating to PIX payment page");
        
        // Store info no localStorage
        localStorage.setItem('lastPedidoId', pedidoTyped.id);
        localStorage.setItem('lastPaymentMethod', 'pix');
        localStorage.setItem('lastPaymentTimestamp', new Date().toISOString());
        
        // Clear cart
        handleClearCart();
        
        // Dismiss loading toast
        sonnerToast.dismiss();
        sonnerToast.success("Gerando QR Code PIX...");
        
        // Navigate to PIX payment page
        navigate(`/pix-payment?pedido=${pedidoTyped.id}`);
        
      } else {
        // 💳 CARTÃO: Processar via Stripe Checkout
        console.log("[Payment Flow] Processing payment via Stripe for order:", pedidoTyped.id);
        
        const checkoutUrl = await processStripeCheckout({
          pedidoId: pedidoTyped.id
        });
        
        // Store checkout info in localStorage
        localStorage.setItem('lastPedidoId', pedidoTyped.id);
        localStorage.setItem('lastPaymentMethod', 'credit_card');
        localStorage.setItem('lastPaymentTimestamp', new Date().toISOString());
        localStorage.setItem('lastCompletedOrderId', pedidoTyped.id);
        
        // Clear cart
        handleClearCart();
        
        // Dismiss loading toast
        sonnerToast.dismiss();
        
        // Redirect to Stripe Checkout
        console.log('[Payment Flow] Redirecting to Stripe Checkout');
        window.location.href = checkoutUrl;
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
    createdOrderId
  };
};
