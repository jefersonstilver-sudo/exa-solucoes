
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
 * Hook for payment processing logic
 */
export const usePaymentProcessor = () => {
  const { createOrder } = useOrderCreation();

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
   * Process payment with Edge Function
   */
  const processPaymentWithEdgeFunction = async ({
    pedidoId,
    cartItems,
    selectedPlan,
    totalPrice,
    couponId,
    sessionUser,
    paymentMethod
  }: {
    pedidoId: string;
    cartItems: CartItem[];
    selectedPlan: number;
    totalPrice: number;
    couponId: string | null;
    sessionUser: any;
    paymentMethod: string;
  }) => {
    // Get application base URL
    const currentUrl = window.location.origin;
    
    // Convert months to days
    const duration = selectedPlan * 30;
    
    // Prepare data for Edge Function
    const paymentData = {
      pedidoId,
      cartItems,
      totals: {
        totalPrice,
        selectedPlan,
        duration,
        withCoupon: !!couponId,
        couponDiscount: couponId ? 10 : 0,
      },
      userId: sessionUser.id,
      returnUrl: `${currentUrl}/pedido-confirmado?id=${pedidoId}`,
      paymentMethod
    };
    
    console.log("[Payment Flow] Sending data to payment processor", {
      pedidoId,
      method: paymentMethod
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
    
    // CRITICAL FIX: Validate the preference_id from response
    if (!data.preference_id) {
      throw new Error('Missing preference_id in payment processor response');
    }
    
    return {
      preferenceId: data.preference_id,
      initPoint: data.init_point
    };
  };

  /**
   * Store checkout information in localStorage
   */
  const storeCheckoutInfo = (pedidoId: string, paymentMethod: string, preferenceId: string) => {
    // CRITICAL FIX: Store trace information in localStorage for debugging
    localStorage.setItem('mp_redirect_timestamp', Date.now().toString());
    localStorage.setItem('mp_preference_id', preferenceId);
    
    // Store order info in localStorage
    localStorage.setItem('lastPedidoId', pedidoId);
    localStorage.setItem('lastPaymentMethod', paymentMethod);
    localStorage.setItem('lastPaymentTimestamp', new Date().toISOString());
  };

  return {
    createPaymentOrder,
    processPaymentWithEdgeFunction,
    storeCheckoutInfo
  };
};
