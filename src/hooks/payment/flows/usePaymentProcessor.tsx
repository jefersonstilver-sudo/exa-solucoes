
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
  const { createPaymentOrder, processPaymentWithEdgeFunction, storeCheckoutInfo } = useOrderCreation();

  /**
   * Create order in database
   */
  const createPaymentOrder2 = async ({
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
    return await createPaymentOrder({
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
  const processPaymentWithEdgeFunction2 = async ({
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
    
    // Determine which edge function to call based on payment method
    const functionName = paymentMethod === 'pix' ? 'process-pix-payment' : 'process-payment';
    
    // Call Edge Function
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: functionName === 'process-pix-payment' ? {
        amount: totalPrice,
        pedidoId,
        description: `Plano: ${selectedPlan} meses`,
        userId: sessionUser.id,
        userEmail: sessionUser.email,
        returnUrl: `${currentUrl}/pedido-confirmado?id=${pedidoId}`
      } : paymentData
    });
    
    if (error) {
      console.error(`[Payment Flow] Edge function error: ${functionName}`, error);
      throw new Error(`Error processing payment: ${error.message}`);
    }
    
    console.log(`[Payment Flow] ${functionName} response:`, data);
    
    if (!data || !data.success) {
      throw new Error('Invalid response from payment processor');
    }
    
    // For PIX payments, we return a different structure
    if (paymentMethod === 'pix') {
      return {
        pixData: data.pix_data,
        pedidoId: data.pedido_id
      };
    }
    
    // For credit card payments, validate the preference_id
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
  const storeCheckoutInfo2 = (pedidoId: string, paymentMethod: string, preferenceId?: string) => {
    // Store order info in localStorage
    localStorage.setItem('lastPedidoId', pedidoId);
    localStorage.setItem('lastPaymentMethod', paymentMethod);
    localStorage.setItem('lastPaymentTimestamp', new Date().toISOString());
    
    // For credit card payments, also store MercadoPago info
    if (paymentMethod === 'credit_card' && preferenceId) {
      localStorage.setItem('mp_redirect_timestamp', Date.now().toString());
      localStorage.setItem('mp_preference_id', preferenceId);
    }
  };

  return {
    createPaymentOrder,
    processPaymentWithEdgeFunction,
    storeCheckoutInfo
  };
};
