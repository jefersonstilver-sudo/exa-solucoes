
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { prepareForInsert, unwrapData } from '@/utils/supabaseUtils';
import { usePaymentValidation } from '../usePaymentValidation';
import { usePaymentDeduplication } from '../usePaymentDeduplication';
import { CreatePaymentOrderParams } from '@/types/order';

export const usePaymentOrderCreator = () => {
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

  return { createPaymentOrder };
};
