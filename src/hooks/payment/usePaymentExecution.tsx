
import { useState, useRef, useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { supabase } from '@/integrations/supabase/client';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface ExecutePaymentOptions {
  pedidoId: string;
  sessionUser: any;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  selectedPlan: number;
  couponId: string | null;
  paymentMethod: string;
}

export const usePaymentExecution = () => {
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const processingPaymentRef = useRef(false);
  
  // Reset processing state when component unmounts
  useEffect(() => {
    return () => {
      processingPaymentRef.current = false;
    };
  }, []);

  const executePayment = async ({
    pedidoId,
    sessionUser,
    startDate,
    endDate,
    totalPrice,
    selectedPlan,
    couponId,
    paymentMethod
  }: ExecutePaymentOptions) => {
    // Set created order ID
    setCreatedOrderId(pedidoId);
    
    // Get application base URL
    const currentUrl = window.location.origin;
    
    // Convert months to days
    const duration = selectedPlan * 30;
    
    // Prepare data for Edge Function
    const paymentData = {
      pedidoId,
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
    
    console.log("[Payment Execution] Sending data to payment processor", {
      pedidoId,
      method: paymentMethod
    });
    
    // Store order info in localStorage
    localStorage.setItem('lastPedidoId', pedidoId);
    localStorage.setItem('lastPaymentMethod', paymentMethod);
    localStorage.setItem('lastPaymentTimestamp', new Date().toISOString());
    
    // Call Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: paymentData
      });
      
      if (error) {
        console.error("[Payment Execution] Edge function error:", error);
        throw new Error(`Error processing payment: ${error.message}`);
      }
      
      console.log("[Payment Execution] Payment processor response:", data);
      
      if (!data || !data.success) {
        throw new Error('Invalid response from payment processor');
      }
      
      return { success: true, preferenceId: data.preference_id };
    } catch (error: any) {
      console.error('[Payment Execution] Payment error:', error);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro no processamento: ${error.message}`,
        { error: String(error), stack: error.stack }
      );
      
      sonnerToast.dismiss();
      sonnerToast.error("Erro ao processar pagamento");
      
      return { success: false, error };
    }
  };
  
  return {
    createdOrderId,
    executePayment,
    isProcessing: () => processingPaymentRef.current,
    setProcessing: (value: boolean) => {
      processingPaymentRef.current = value;
    }
  };
};
