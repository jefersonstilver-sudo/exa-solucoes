
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { prepareForInsert, unwrapData } from '@/utils/supabaseUtils';
import { ProcessPaymentParams } from '@/types/order';

export const usePaymentProcessor = () => {
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

      // CRITICAL: Add unique payment identifier to prevent duplicate processing
      const paymentKey = `payment_${pedidoId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      // CRITICAL: Ensure correct total price is passed
      const correctTotalPrice = Number(totalPrice.toFixed(2));
      
      // Call the appropriate edge function based on payment method
      const functionName = paymentMethod === 'pix' ? 'process-pix-payment' : 'process-payment';
      
      const { data: responseData, error } = await supabase.functions.invoke(functionName, {
        body: {
          pedido_id: pedidoId,
          payment_method: paymentMethod,
          total_amount: correctTotalPrice, // Use correct total price
          cart_items: cartItems.map(item => ({
            panel_id: item.panel.id,
            duration: item.duration,
            price: correctTotalPrice // Don't divide by cart items - use full price
          })),
          selected_plan: selectedPlan,
          coupon_id: couponId,
          user_id: sessionUser.id,
          payment_key: paymentKey, // Add unique payment key
          idempotency_key: paymentKey, // Add idempotency key
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

      // Get the updated order data only once
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

      // Only create campaigns for credit card payments and only once
      if (paymentMethod === 'credit_card' && updatedOrderTyped.lista_paineis) {
        const panelIds = Array.isArray(updatedOrderTyped.lista_paineis) 
          ? updatedOrderTyped.lista_paineis 
          : [updatedOrderTyped.lista_paineis];

        // Check if campaigns already exist for this order
        const { data: existingCampaigns } = await supabase
          .from('campanhas')
          .select('id')
          .eq('client_id', sessionUser.id)
          .in('painel_id', panelIds)
          .gte('created_at', updatedOrderTyped.created_at);

        // Only create campaigns if none exist yet
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

  return { processPaymentWithEdgeFunction };
};
