
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { useOrderCreation } from '../useOrderCreation';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface ProcessPaymentConfig {
  pedidoId: string;
  cartItems: CartItem[];
  totalPrice: number;
  selectedPlan: number;
  couponId: string | null;
  startDate: Date;
  endDate: Date;
  sessionUser: any;
  paymentMethod: string;
  redirectToMercadoPago: (preferenceId: string, paymentMethod: string) => void;
}

/**
 * Hook for payment processing logic using Stripe
 */
export const usePaymentProcessor = () => {
  const { createPaymentOrder: createOrder } = useOrderCreation();

  /**
   * Create order in database
   */
  const createPaymentOrder = async ({
    sessionUser,
    cartItems,
    selectedPlan,
    totalPrice,
    couponId,
    startDate,
    endDate
  }: {
    sessionUser: any;
    cartItems: CartItem[];
    selectedPlan: number;
    totalPrice: number;
    couponId: string | null;
    startDate: Date;
    endDate: Date;
  }) => {
    return await createOrder({
      sessionUser,
      cartItems,
      selectedPlan,
      totalPrice,
      couponId,
      startDate,
      endDate
    });
  };

  /**
   * Process payment with Stripe Checkout
   */
  const processStripeCheckout = async ({
    pedidoId
  }: {
    pedidoId: string;
  }) => {
    console.log("[Payment Processor] Creating Stripe Checkout session for order:", pedidoId);
    
    // Call Stripe Create Checkout edge function
    const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
      body: { pedidoId }
    });
    
    if (error) {
      console.error("[Payment Processor] Stripe edge function error:", error);
      throw new Error(`Erro ao criar sessão de pagamento: ${error.message}`);
    }
    
    console.log("[Payment Processor] Stripe checkout session created:", data);
    
    if (!data || !data.url) {
      throw new Error('URL de checkout não retornada pelo servidor');
    }
    
    return data.url;
  };

  return {
    createPaymentOrder,
    processStripeCheckout
  };
};

