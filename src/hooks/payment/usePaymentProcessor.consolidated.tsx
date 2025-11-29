
import { useState, useEffect } from 'react';
import { Panel } from '@/types/panel';
import { usePaymentFlow } from './usePaymentFlow';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast as sonnerToast } from 'sonner';
import { CartItem, PaymentResponse } from '@/types/payment';
import { supabase } from '@/integrations/supabase/client';
import { prepareForInsert, unwrapData } from '@/utils/supabaseUtils';

interface PaymentOptions {
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

interface ProcessPaymentParams {
  pedidoId: string;
  cartItems: CartItem[];
  selectedPlan: number;
  totalPrice: number;
  couponId: string | null;
  sessionUser: any;
  paymentMethod: string;
}

/**
 * CONSOLIDATED Payment Processor Hook
 * This is the ONLY payment processor hook in the system
 * Handles both PIX and Stripe payments through a unified interface
 */
export const usePaymentProcessor = () => {
  const { isCreatingPayment, processPayment } = usePaymentFlow();
  const [paymentMethod, setPaymentMethod] = useState<string>('pix');
  
  // Log payment method changes
  useEffect(() => {
    console.log(`[Payment Processor] Payment method selected: ${paymentMethod}`);
    
    logCheckoutEvent(
      CheckoutEvent.DEBUG_EVENT,
      LogLevel.INFO,
      `Método de pagamento selecionado: ${paymentMethod}`,
      { paymentMethod, timestamp: new Date().toISOString() }
    );
    
    try {
      localStorage.setItem('preferred_payment_method', paymentMethod);
    } catch (e) {
      console.error("Error storing payment method preference:", e);
    }
  }, [paymentMethod]);
  
  // Restore payment method from localStorage
  useEffect(() => {
    try {
      const savedMethod = localStorage.getItem('preferred_payment_method');
      if (savedMethod && (savedMethod === 'credit_card' || savedMethod === 'pix')) {
        console.log(`[Payment Processor] Restoring saved payment method: ${savedMethod}`);
        setPaymentMethod(savedMethod);
      }
    } catch (e) {
      console.error("Error restoring payment method preference:", e);
    }
  }, []);
  
  /**
   * Main payment creation function
   */
  const createPayment = async (options: PaymentOptions): Promise<PaymentResponse | undefined> => {
    if (!options.acceptTerms) {
      console.error("[Payment Processor] Payment attempted without accepting terms");
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        "Tentativa de pagamento sem aceitar os termos",
        { acceptTerms: options.acceptTerms, timestamp: new Date().toISOString() }
      );
      
      sonnerToast.error("É necessário aceitar os termos para continuar");
      return undefined;
    }
    
    const effectivePaymentMethod = options.paymentMethod || paymentMethod;
    
    console.log(`[Payment Processor] Creating payment with method: ${effectivePaymentMethod}`);
    
    const panelIds = options.cartItems.map(item => item.panel.id);
    
    logCheckoutEvent(
      CheckoutEvent.PAYMENT_PROCESSING,
      LogLevel.INFO,
      `Iniciando processamento de pagamento via ${effectivePaymentMethod}`,
      {
        totalPrice: options.totalPrice, 
        selectedPlan: options.selectedPlan,
        panelCount: options.cartItems.length,
        panelIds: panelIds,
        paymentMethod: effectivePaymentMethod,
        userAgent: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        url: window.location.href
      }
    );
    
    try {
      localStorage.setItem('last_payment_attempt', new Date().toISOString());
      localStorage.setItem('last_payment_method', effectivePaymentMethod);
      localStorage.setItem('last_payment_amount', String(options.totalPrice));
    } catch (e) {
      console.error("Error storing payment attempt info:", e);
    }
    
    return await processPayment({
      ...options,
      paymentMethod: effectivePaymentMethod
    });
  };

  /**
   * Process payment with edge function (Mercado Pago PIX Native)
   */
  const processPaymentWithEdgeFunction = async (params: ProcessPaymentParams) => {
    const {
      pedidoId,
      cartItems,
      selectedPlan,
      totalPrice,
      couponId,
      sessionUser,
      paymentMethod
    } = params;

    try {
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Processando pagamento via Edge Function: ${paymentMethod}`,
        { pedidoId, paymentMethod, totalPrice }
      );

      const paymentKey = `payment_${pedidoId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const correctTotalPrice = Number(totalPrice.toFixed(2));
      
      // Call process-payment edge function for native PIX
      const { data: responseData, error } = await supabase.functions.invoke('process-payment', {
        body: {
          pedido_id: pedidoId,
          payment_method: paymentMethod,
          total_amount: correctTotalPrice,
          cart_items: cartItems.map(item => ({
            panel_id: item.panel.id,
            duration: item.duration,
            price: correctTotalPrice
          })),
          selected_plan: selectedPlan,
          coupon_id: couponId,
          user_id: sessionUser.id,
          payment_key: paymentKey,
          idempotency_key: paymentKey,
          anti_duplicate_controls: {
            original_total: totalPrice,
            corrected_total: correctTotalPrice,
            processing_timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      const pedido = unwrapData(responseData);
      if (!pedido) {
        throw new Error('Falha ao processar pagamento: resposta inválida');
      }

      // Get updated order data
      const { data: updatedOrderData, error: fetchError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar pedido atualizado:', fetchError);
        return responseData;
      }

      const updatedOrder = unwrapData(updatedOrderData);
      if (!updatedOrder) return responseData;

      const updatedOrderTyped = updatedOrder as any;

      // Create campaigns for credit card payments
      if (paymentMethod === 'credit_card' && updatedOrderTyped.lista_paineis) {
        const panelIds = Array.isArray(updatedOrderTyped.lista_paineis) 
          ? updatedOrderTyped.lista_paineis 
          : [updatedOrderTyped.lista_paineis];

        const { data: existingCampaigns } = await supabase
          .from('campanhas')
          .select('id')
          .eq('client_id', sessionUser.id)
          .in('painel_id', panelIds)
          .gte('created_at', updatedOrderTyped.created_at);

        if (!existingCampaigns || existingCampaigns.length === 0) {
          for (const panelId of panelIds) {
            const campaignData = prepareForInsert({
              client_id: sessionUser.id,
              painel_id: panelId,
              video_id: 'default_video_id',
              data_inicio: updatedOrderTyped.data_inicio,
              data_fim: updatedOrderTyped.data_fim,
              status: 'ativa'
            });

            const { error: campaignError } = await supabase
              .from('campanhas')
              .insert(campaignData as any);

            if (campaignError) {
              console.error('Erro ao criar campanha:', campaignError);
            }
          }
        }
      }

      return responseData;

    } catch (error: any) {
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        'Erro ao processar pagamento via Edge Function',
        { 
          pedidoId,
          paymentMethod,
          error: error.message
        }
      );
      throw error;
    }
  };

  return {
    isCreatingPayment,
    createPayment,
    processPaymentWithEdgeFunction,
    paymentMethod,
    setPaymentMethod
  };
};
