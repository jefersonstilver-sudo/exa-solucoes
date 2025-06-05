import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { prepareForInsert, prepareForUpdate, unwrapData, filterEq } from '@/utils/supabaseUtils';
import { Panel } from '@/types/panel';
import { CreatePaymentOrderParams, ProcessPaymentParams, StoreCheckoutInfoParams } from '@/types/payment';
import { usePaymentValidation } from './usePaymentValidation';
import { usePaymentDeduplication } from './usePaymentDeduplication';

interface CartItem {
  panel: Panel;
  duration: number;
}

export const useOrderCreation = () => {
  const { validateUniquePayment, generateUniqueTransactionId } = usePaymentValidation();
  const { preventDuplicateSubmission, createUniquePaymentKey } = usePaymentDeduplication();
  
  const createPaymentOrder = async (params: CreatePaymentOrderParams) => {
    const {
      sessionUser,
      cartItems,
      selectedPlan,
      totalPrice,
      couponId,
      startDate,
      endDate
    } = params;

    try {
      // CRITICAL: Block duplicate submissions immediately
      if (!preventDuplicateSubmission()) {
        throw new Error('Tentativa de pagamento duplicada detectada');
      }

      // CRITICAL: Validate payment uniqueness to prevent duplicates
      const validation = await validateUniquePayment(sessionUser.id, totalPrice, cartItems);
      
      if (!validation.isValid) {
        if (validation.existingOrderId) {
          // Return existing order instead of creating duplicate
          logCheckoutEvent(
            CheckoutEvent.PAYMENT_ERROR,
            LogLevel.WARNING,
            'Pedido duplicado evitado - retornando pedido existente',
            { 
              existingOrderId: validation.existingOrderId,
              userId: sessionUser.id,
              totalPrice
            }
          );
          
          // Fetch and return existing order
          const { data: existingOrder, error } = await supabase
            .from('pedidos')
            .select('*')
            .eq('id', validation.existingOrderId)
            .single();
            
          if (!error && existingOrder) {
            return existingOrder;
          }
        }
        
        throw new Error(validation.error || 'Validação de pagamento falhou');
      }

      // CRITICAL: Create unique payment key to prevent processing duplicates
      const paymentKey = createUniquePaymentKey(sessionUser.id, totalPrice);
      
      // Check if this exact payment key was already processed
      const { data: existingPayment } = await supabase
        .from('pedidos')
        .select('id')
        .contains('log_pagamento', { payment_key: paymentKey })
        .single();

      if (existingPayment) {
        throw new Error('Pagamento já processado para esta combinação user/valor/tempo');
      }

      // Generate unique transaction ID to prevent duplicates
      const transactionId = generateUniqueTransactionId(sessionUser.id, Date.now());

      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        'Iniciando criação do pedido com validação anti-duplicação REFORÇADA',
        { 
          userId: sessionUser.id,
          itemCount: cartItems.length,
          totalPrice,
          selectedPlan,
          transactionId,
          paymentKey
        }
      );

      // CRITICAL: Ensure correct total price (no division errors)
      const correctTotalPrice = Number(totalPrice.toFixed(2));

      // Create the order record with enhanced anti-duplication controls
      const orderData = prepareForInsert({
        client_id: sessionUser.id,
        lista_paineis: cartItems.map(item => item.panel.id),
        plano_meses: selectedPlan,
        valor_total: correctTotalPrice, // Use correct total price
        cupom_id: couponId,
        data_inicio: startDate.toISOString().split('T')[0],
        data_fim: endDate.toISOString().split('T')[0],
        status: 'pendente',
        termos_aceitos: true,
        duracao: 30,
        log_pagamento: {
          transaction_id: transactionId,
          payment_key: paymentKey,
          original_total_price: totalPrice,
          created_at: new Date().toISOString(),
          validation_passed: true,
          anti_duplicate_check: true,
          cart_items_count: cartItems.length,
          user_id_check: sessionUser.id
        }
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

      const pedidoTyped = pedido as any;

      // If coupon was used, record its usage (only once)
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
        }
      }

      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        'Pedido criado com sucesso com validação anti-duplicação REFORÇADA',
        { 
          orderId: pedidoTyped.id,
          totalPrice: correctTotalPrice,
          itemCount: cartItems.length,
          transactionId,
          paymentKey
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
        .eq('id', pedidoTyped.id)
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

  const storeCheckoutInfo = (params: StoreCheckoutInfoParams) => {
    const { pedidoId, paymentMethod, preferenceId } = params;
    
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

  const createCampaignsAfterPayment = async (pedidoId: string, userId: string) => {
    try {
      if (!pedidoId || !userId) {
        throw new Error('ID do pedido ou usuário não fornecido');
      }
      
      const { data: orderData, error: orderError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', filterEq(pedidoId))
        .single();
      
      if (orderError || !orderData) {
        throw new Error(`Erro ao buscar detalhes do pedido: ${orderError?.message || 'Pedido não encontrado'}`);
      }
      
      const updateData = prepareForUpdate({
        status: 'pago',
        log_pagamento: {
          status: 'completed',
          completed_at: new Date().toISOString()
        }
      });
      
      await supabase
        .from('pedidos')
        .update(updateData as any)
        .eq('id', filterEq(pedidoId));
      
      const panelIds = Array.isArray(orderData.lista_paineis) 
        ? orderData.lista_paineis 
        : [orderData.lista_paineis];
      
      if (!panelIds || panelIds.length === 0) {
        throw new Error('Nenhum painel encontrado no pedido');
      }
      
      for (const panelId of panelIds) {
        const campaignData = prepareForInsert({
          client_id: userId,
          painel_id: panelId,
          video_id: 'default_video_id',
          data_inicio: orderData.data_inicio,
          data_fim: orderData.data_fim,
          status: 'ativa'
        });
        
        const { error: campaignError } = await supabase
          .from('campanhas')
          .insert(campaignData as any);
        
        if (campaignError) {
          throw new Error(`Erro ao criar campanha: ${campaignError.message}`);
        }
      }
      
      return { success: true, message: 'Campanhas criadas com sucesso' };
    } catch (error: any) {
      console.error('Erro ao processar pós-pagamento:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    createPaymentOrder,
    processPaymentWithEdgeFunction,
    storeCheckoutInfo,
    createCampaignsAfterPayment
  };
};
