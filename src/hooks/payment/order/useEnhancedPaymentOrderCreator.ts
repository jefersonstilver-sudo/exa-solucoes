import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { usePaymentValidation } from '../usePaymentValidation';
import { usePaymentDeduplication } from '../usePaymentDeduplication';
import { CreatePaymentOrderParams } from '@/types/order';
import { useCheckoutDataPersistence } from '@/hooks/useCheckoutDataPersistence';
import { getAuditInfo } from '@/utils/deviceInfo';
import { extractBuildingIds, validateCartItemsIntegrity } from '@/utils/cartSecurity';

interface PedidoType {
  id: string;
  lista_paineis: string[];
  lista_predios: string[];
  valor_total: number;
  client_id: string;
}

interface DatabasePedidoResponse {
  id: string;
  lista_paineis: string[] | null;
  lista_predios: string[] | null;
  valor_total: number | null;
  client_id: string;
  [key: string]: any;
}

interface PriceValidationResponse {
  isValid: boolean;
  serverPrice: number;
  clientPrice: number;
  priceDifference: number;
  isPotentialFraud: boolean;
  signature: string;
  message?: string;
}

async function validatePriceOnServer(
  buildingIds: string[],
  planMonths: number,
  clientPrice: number,
  couponCode?: string,
  applyPixDiscount: boolean = true,
  userId?: string
): Promise<PriceValidationResponse> {
  console.log('🔐 [PRICE_VALIDATION] Starting server-side price validation...');
  
  const { data, error } = await supabase.functions.invoke('validate-order-price', {
    body: { buildingIds, planMonths, clientPrice, couponCode, applyPixDiscount, userId }
  });

  if (error) throw new Error(`Price validation failed: ${error.message}`);
  
  console.log('✅ [PRICE_VALIDATION] Server response:', data);
  return data as PriceValidationResponse;
}

export const useEnhancedPaymentOrderCreator = () => {
  const { validateUniquePayment, generateUniqueTransactionId } = usePaymentValidation();
  const { preventDuplicateSubmission, createUniquePaymentKey } = usePaymentDeduplication();
  const { saveCompletePurchaseAttempt } = useCheckoutDataPersistence();
  
  const createPaymentOrder = async (params: CreatePaymentOrderParams) => {
    const { sessionUser, cartItems, selectedPlan, totalPrice, couponId, couponCode, startDate, endDate, paymentMethod } = params;

    try {
      console.log('🚀 [ENHANCED_ORDER_CREATOR] Iniciando criação do pedido...');

      // Validate cart integrity
      const cartValidation = validateCartItemsIntegrity(cartItems);
      if (!cartValidation.isValid) {
        throw new Error(`Dados do carrinho inválidos: ${cartValidation.issues.join(', ')}`);
      }

      // Check user role - block admins
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', sessionUser.id).single();
      if (roleData?.role && roleData.role !== 'client') {
        throw new Error('Contas administrativas não podem realizar pedidos.');
      }

      if (!preventDuplicateSubmission()) {
        throw new Error('Tentativa de pagamento duplicada detectada');
      }

      const validation = await validateUniquePayment(sessionUser.id, totalPrice, cartItems);
      if (!validation.isValid) {
        if (validation.existingOrderId) {
          const { data: existingOrder } = await supabase.from('pedidos').select('*').eq('id', validation.existingOrderId).single();
          if (existingOrder) return existingOrder as PedidoType;
        }
        throw new Error(validation.error || 'Validação de pagamento falhou');
      }

      const panelIds = cartItems.map(item => item.panel?.id).filter(Boolean);
      const buildingIds = extractBuildingIds(cartItems);

      if (panelIds.length === 0 || buildingIds.length === 0) {
        throw new Error('Nenhum painel/prédio válido encontrado no carrinho');
      }

      // 🔐 SERVER-SIDE PRICE VALIDATION
      const priceValidation = await validatePriceOnServer(
        buildingIds, selectedPlan, totalPrice, couponCode, paymentMethod === 'pix', sessionUser.id
      );

      if (!priceValidation.isValid) {
        localStorage.removeItem('simple_cart');
        throw new Error(`Divergência de preço detectada (R$ ${totalPrice.toFixed(2)} vs R$ ${priceValidation.serverPrice.toFixed(2)}). Recarregue a página.`);
      }

      const validatedPrice = priceValidation.serverPrice;

      // Validate buildings exist
      const { data: buildingData, error: buildingError } = await supabase.from('buildings').select('id, nome, status').in('id', buildingIds);
      if (buildingError || !buildingData?.length) {
        localStorage.removeItem('simple_cart');
        throw new Error('Prédios do carrinho não disponíveis.');
      }

      const paymentKey = createUniquePaymentKey(sessionUser.id, validatedPrice);
      const transactionId = generateUniqueTransactionId(sessionUser.id, Date.now());
      const auditInfo = await getAuditInfo();

      const orderData = {
        client_id: sessionUser.id,
        lista_paineis: panelIds,
        lista_predios: buildingIds,
        plano_meses: selectedPlan,
        valor_total: Number(validatedPrice.toFixed(2)),
        cupom_id: couponId,
        data_inicio: startDate.toISOString().split('T')[0],
        data_fim: endDate.toISOString().split('T')[0],
        status: 'pendente',
        metodo_pagamento: paymentMethod || 'pix',
        termos_aceitos: true,
        transaction_id: transactionId,
        price_sync_verified: true,
        ip_origem: auditInfo.ipOrigem,
        device_info: auditInfo.deviceInfo,
        expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        log_pagamento: {
          transaction_id: transactionId,
          payment_key: paymentKey,
          original_client_price: totalPrice,
          server_validated_price: validatedPrice,
          price_validation_signature: priceValidation.signature,
          created_at: new Date().toISOString(),
          validation_passed: true,
          price_server_validated: true
        }
      };

      const { data: pedidoData, error: pedidoError } = await supabase.from('pedidos').insert(orderData).select().single();
      if (pedidoError) throw new Error(`Erro ao criar pedido: ${pedidoError.message}`);

      const dbResponse = pedidoData as DatabasePedidoResponse;
      console.log('✅ [ENHANCED_ORDER_CREATOR] Pedido criado:', dbResponse.id);

      return {
        id: dbResponse.id,
        lista_paineis: dbResponse.lista_paineis || [],
        lista_predios: dbResponse.lista_predios || [],
        valor_total: dbResponse.valor_total || 0,
        client_id: dbResponse.client_id
      } as PedidoType;

    } catch (error: any) {
      console.error('💥 [ENHANCED_ORDER_CREATOR] Erro:', error);
      logCheckoutEvent(CheckoutEvent.PAYMENT_ERROR, LogLevel.ERROR, error.message, { userId: sessionUser?.id });
      throw error;
    }
  };

  return { createPaymentOrder };
};
