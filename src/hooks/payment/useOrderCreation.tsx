
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { prepareForInsert, prepareForUpdate, unwrapData, filterEq } from '@/utils/supabaseUtils';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface CreatePaymentOrderParams {
  sessionUser: any;
  cartItems: CartItem[];
  selectedPlan: number;
  totalPrice: number;
  couponId: string | null;
  startDate: Date;
  endDate: Date;
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

interface StoreCheckoutInfoParams {
  pedidoId: string;
  paymentMethod: string;
  preferenceId?: string;
}

export const useOrderCreation = () => {
  
  const createPaymentOrder = async ({
    sessionUser,
    cartItems,
    selectedPlan,
    totalPrice,
    couponId,
    startDate,
    endDate
  }: CreatePaymentOrderParams) => {
    try {
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        'Iniciando criação do pedido',
        { 
          userId: sessionUser.id,
          itemCount: cartItems.length,
          totalPrice,
          selectedPlan
        }
      );

      // Create the order record
      const orderData = prepareForInsert({
        client_id: sessionUser.id,
        lista_paineis: cartItems.map(item => item.panel.id),
        plano_meses: selectedPlan,
        valor_total: totalPrice,
        cupom_id: couponId,
        data_inicio: startDate.toISOString().split('T')[0],
        data_fim: endDate.toISOString().split('T')[0],
        status: 'pendente',
        termos_aceitos: true,
        duracao: 30 // Default duration in days
      });

      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert(orderData as any)
        .select()
        .single();

      if (pedidoError) {
        throw new Error(`Erro ao criar pedido: ${pedidoError.message}`);
      }

      const pedido = unwrapData(pedidoData);
      if (!pedido) {
        throw new Error('Falha ao criar pedido: dados inválidos retornados');
      }

      // Type assertion for safer access
      const pedidoTyped = pedido as any;

      // If coupon was used, record its usage
      if (couponId) {
        const couponUsageData = prepareForInsert({
          cupom_id: couponId,
          user_id: sessionUser.id,
          pedido_id: pedidoTyped.id
        });

        const { error: couponError } = await supabase
          .from('cupom_usos')
          .insert(couponUsageData as any);

        if (couponError) {
          console.error('Erro ao registrar uso do cupom:', couponError);
          // Don't fail the entire process for coupon usage errors
        }
      }

      // Update the order with payment log placeholder
      const updateData = prepareForUpdate({
        log_pagamento: {
          status: 'pending',
          created_at: new Date().toISOString(),
          payment_method: 'pix'
        }
      });

      await supabase
        .from('pedidos')
        .update(updateData as any)
        .eq('id', pedidoTyped.id);

      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        'Pedido criado com sucesso',
        { 
          orderId: pedidoTyped.id,
          totalPrice,
          itemCount: cartItems.length
        }
      );

      return pedido;

    } catch (error: any) {
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        'Erro ao criar pedido',
        { 
          error: error.message,
          userId: sessionUser?.id
        }
      );
      throw error;
    }
  };

  const processPaymentWithEdgeFunction = async ({
    pedidoId,
    cartItems,
    selectedPlan,
    totalPrice,
    couponId,
    sessionUser,
    paymentMethod
  }: ProcessPaymentParams) => {
    try {
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `Processando pagamento via Edge Function: ${paymentMethod}`,
        { pedidoId, paymentMethod, totalPrice }
      );

      // Call the appropriate edge function based on payment method
      const functionName = paymentMethod === 'pix' ? 'process-pix-payment' : 'process-payment';
      
      const { data: responseData, error } = await supabase.functions.invoke(functionName, {
        body: {
          pedido_id: pedidoId,
          payment_method: paymentMethod,
          total_amount: totalPrice,
          cart_items: cartItems.map(item => ({
            panel_id: item.panel.id,
            duration: item.duration,
            price: totalPrice / cartItems.length // Simple price division
          })),
          selected_plan: selectedPlan,
          coupon_id: couponId,
          user_id: sessionUser.id
        }
      });

      if (error) throw error;

      // Update order with payment information
      const pedido = unwrapData(responseData);
      if (!pedido) {
        throw new Error('Falha ao processar pagamento: resposta inválida');
      }

      // Type assertion for safer access
      const pedidoTyped = pedido as any;

      // Get the updated order data
      const { data: updatedOrderData, error: fetchError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoTyped.id)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar pedido atualizado:', fetchError);
        return responseData; // Return original response if fetch fails
      }

      const updatedOrder = unwrapData(updatedOrderData);
      if (!updatedOrder) return responseData;

      // Type assertion for safer access
      const updatedOrderTyped = updatedOrder as any;

      // If this is a credit card payment, create campaigns
      if (paymentMethod === 'credit_card' && updatedOrderTyped.lista_paineis) {
        const panelIds = Array.isArray(updatedOrderTyped.lista_paineis) 
          ? updatedOrderTyped.lista_paineis 
          : [updatedOrderTyped.lista_paineis];

        const campaignData = panelIds.map((panelId: string) => prepareForInsert({
          client_id: sessionUser.id,
          painel_id: panelId,
          video_id: 'default_video_id', // This should come from user's uploaded video
          data_inicio: updatedOrderTyped.data_inicio,
          data_fim: updatedOrderTyped.data_fim,
          status: 'ativa'
        }));

        const { error: campaignError } = await supabase
          .from('campanhas')
          .insert(campaignData as any);

        if (campaignError) {
          console.error('Erro ao criar campanhas:', campaignError);
          // Don't fail the payment process for campaign creation errors
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

  const storeCheckoutInfo = ({ pedidoId, paymentMethod, preferenceId }: StoreCheckoutInfoParams) => {
    try {
      const checkoutInfo = {
        orderId: pedidoId,
        paymentMethod,
        preferenceId,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('checkout_info', JSON.stringify(checkoutInfo));
      
      logCheckoutEvent(
        CheckoutEvent.DEBUG_EVENT,
        LogLevel.INFO,
        'Informações de checkout armazenadas',
        checkoutInfo
      );

    } catch (error: any) {
      console.error('Erro ao armazenar informações de checkout:', error);
    }
  };

  // Add the missing createCampaignsAfterPayment method required by usePaymentSimulator
  const createCampaignsAfterPayment = async (pedidoId: string, userId: string) => {
    try {
      if (!pedidoId || !userId) {
        throw new Error('ID do pedido ou usuário não fornecido');
      }
      
      // Get the order details
      const { data: orderData, error: orderError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', filterEq(pedidoId))
        .single();
      
      if (orderError || !orderData) {
        throw new Error(`Erro ao buscar detalhes do pedido: ${orderError?.message || 'Pedido não encontrado'}`);
      }
      
      // Update order status to 'pago'
      const updateData = prepareForUpdate({
        status: 'pago',
        log_pagamento: {
          ...(orderData.log_pagamento || {}),
          status: 'completed',
          completed_at: new Date().toISOString()
        }
      });
      
      await supabase
        .from('pedidos')
        .update(updateData as any)
        .eq('id', filterEq(pedidoId));
      
      // Create campaigns for each panel
      const panelIds = Array.isArray(orderData.lista_paineis) 
        ? orderData.lista_paineis 
        : [orderData.lista_paineis];
      
      if (!panelIds || panelIds.length === 0) {
        throw new Error('Nenhum painel encontrado no pedido');
      }
      
      const campaignData = panelIds.map(panelId => prepareForInsert({
        client_id: userId,
        painel_id: panelId,
        video_id: 'default_video_id', // This should come from user's uploaded video
        data_inicio: orderData.data_inicio,
        data_fim: orderData.data_fim,
        status: 'ativa'
      }));
      
      const { error: campaignError } = await supabase
        .from('campanhas')
        .insert(campaignData as any);
      
      if (campaignError) {
        throw new Error(`Erro ao criar campanhas: ${campaignError.message}`);
      }
      
      return { success: true, message: 'Campanhas criadas com sucesso' };
    } catch (error: any) {
      console.error('Erro ao processar pós-pagamento:', error);
      return { success: false, error: error.message };
    }
  };

  // Fixed: Add the createOrder method that was missing
  const createOrder = async (orderData: CreatePaymentOrderParams) => {
    return await createPaymentOrder(orderData);
  };

  return {
    createPaymentOrder,
    processPaymentWithEdgeFunction,
    storeCheckoutInfo,
    createCampaignsAfterPayment,
    createOrder // Add the missing method
  };
};
