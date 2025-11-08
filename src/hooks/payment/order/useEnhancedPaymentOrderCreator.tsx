
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { prepareForInsert, unwrapData } from '@/utils/supabaseUtils';
import { usePaymentValidation } from '../usePaymentValidation';
import { usePaymentDeduplication } from '../usePaymentDeduplication';
import { CreatePaymentOrderParams } from '@/types/order';
import { useCheckoutDataPersistence } from '@/hooks/useCheckoutDataPersistence';

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

export const useEnhancedPaymentOrderCreator = () => {
  const { validateUniquePayment, generateUniqueTransactionId } = usePaymentValidation();
  const { preventDuplicateSubmission, createUniquePaymentKey } = usePaymentDeduplication();
  const { saveCompletePurchaseAttempt } = useCheckoutDataPersistence();
  
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
      console.log('🚀 [ENHANCED_ORDER_CREATOR] Iniciando criação do pedido...');
      console.log('📊 [ENHANCED_ORDER_CREATOR] Parâmetros recebidos:', {
        userId: sessionUser.id,
        cartItemsCount: cartItems.length,
        totalPrice,
        selectedPlan
      });

      // 🚨 CRITICAL: Verificar role do usuário (BLOQUEAR ADMINS)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', sessionUser.id)
        .single();

      const userRole = roleData?.role || 'client';

      console.log('🔐 [ENHANCED_ORDER_CREATOR] Role verificado:', userRole);

      // 🚫 BLOQUEAR admins de fazer pedidos
      if (userRole !== 'client') {
        const errorMsg = `🚫 Contas administrativas não podem realizar pedidos. Role detectado: ${userRole}`;
        console.error(errorMsg);
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.ERROR,
          'Tentativa de pedido por conta administrativa bloqueada',
          { userId: sessionUser.id, userRole, cartItemsCount: cartItems.length }
        );
        
        throw new Error('Contas administrativas não podem realizar pedidos. Use uma conta de cliente.');
      }

      // CRITICAL: Block duplicate submissions immediately
      if (!preventDuplicateSubmission()) {
        throw new Error('Tentativa de pagamento duplicada detectada');
      }

      // CRITICAL: Validate payment uniqueness to prevent duplicates
      const validation = await validateUniquePayment(sessionUser.id, totalPrice, cartItems);
      
      if (!validation.isValid) {
        if (validation.existingOrderId) {
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
          
          const { data: existingOrder, error } = await supabase
            .from('pedidos')
            .select('*')
            .eq('id', validation.existingOrderId)
            .single();
            
          if (!error && existingOrder) {
            return existingOrder as PedidoType;
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

      // ENHANCED: Tentar capturar tentativa primeiro e usar como source_tentativa_id
      let sourceTentativaId = null;
      try {
        const savedAttempt = await saveCompletePurchaseAttempt(sessionUser.id, cartItems, totalPrice);
        if (savedAttempt?.id) {
          sourceTentativaId = savedAttempt.id;
          console.log('✅ [ENHANCED_ORDER_CREATOR] Tentativa de compra salva e vinculada:', sourceTentativaId);
        }
      } catch (attemptError) {
        console.warn('⚠️ [ENHANCED_ORDER_CREATOR] Erro ao salvar tentativa (continuando sem vincular):', attemptError);
      }

      // ENHANCED: Extract panel and building IDs with detailed logging
      const panelIds = cartItems.map(item => {
        const panelId = item.panel?.id;
        console.log('🔍 [ENHANCED_ORDER_CREATOR] Extraindo panel ID:', panelId, 'do item:', item);
        return panelId;
      }).filter(Boolean);
      
      console.log('📊 [ENHANCED_ORDER_CREATOR] Panel IDs extraídos:', panelIds);

      if (panelIds.length === 0) {
        throw new Error('Nenhum painel válido encontrado no carrinho');
      }

      // ENHANCED: Extract building IDs from panel data
      const { data: panelData, error: panelError } = await supabase
        .from('painels')
        .select('id, building_id')
        .in('id', panelIds);

      if (panelError) {
        console.error('❌ [ENHANCED_ORDER_CREATOR] Erro ao buscar dados dos painéis:', panelError);
        throw new Error('Erro ao validar painéis selecionados');
      }

      if (!panelData || panelData.length === 0) {
        throw new Error('Painéis selecionados não encontrados no sistema');
      }

      const buildingIds = [...new Set(
        panelData.map(p => p.building_id).filter(Boolean)
      )];
      
      console.log('🏢 [ENHANCED_ORDER_CREATOR] Building IDs extraídos:', buildingIds);

      if (buildingIds.length === 0) {
        throw new Error('Nenhum prédio válido encontrado para os painéis selecionados');
      }

      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        'Criando pedido com dados completos de localização',
        { 
          userId: sessionUser.id,
          itemCount: cartItems.length,
          panelIds: panelIds,
          buildingIds: buildingIds,
          totalPrice,
          selectedPlan,
          transactionId,
          paymentKey,
          sourceTentativaId
        }
      );

      // CRITICAL: Ensure correct total price (no division errors)
      const correctTotalPrice = Number(totalPrice.toFixed(2));

      // Create the order record with COMPLETE data including source_tentativa_id
      const orderData = {
        client_id: sessionUser.id,
        lista_paineis: panelIds,
        lista_predios: buildingIds,
        plano_meses: selectedPlan,
        valor_total: correctTotalPrice,
        cupom_id: couponId,
        data_inicio: startDate.toISOString().split('T')[0],
        data_fim: endDate.toISOString().split('T')[0],
        status: 'pendente',
        termos_aceitos: true,
        source_tentativa_id: sourceTentativaId, // NOVO: Vinculação com tentativa
        transaction_id: transactionId,
        price_sync_verified: true,
        log_pagamento: {
          transaction_id: transactionId,
          payment_key: paymentKey,
          original_total_price: totalPrice,
          created_at: new Date().toISOString(),
          validation_passed: true,
          anti_duplicate_check: true,
          cart_items_count: cartItems.length,
          user_id_check: sessionUser.id,
          panel_ids_saved: panelIds,
          building_ids_saved: buildingIds,
          enhanced_creation: true,
          source_tentativa_id: sourceTentativaId,
          cart_items_debug: cartItems.map(item => ({
            panel_id: item.panel?.id,
            building_id: item.panel?.building_id,
            panel_name: item.panel?.buildings?.nome || 'Nome não disponível',
            building_name: item.panel?.buildings?.nome || 'Nome não disponível',
            duration: item.duration || 30,
            price: item.duration ? (item.duration * 50) : 0
          }))
        }
      };

      console.log('💾 [ENHANCED_ORDER_CREATOR] Dados do pedido preparados:', {
        lista_paineis: orderData.lista_paineis,
        lista_predios: orderData.lista_predios,
        valor_total: orderData.valor_total,
        source_tentativa_id: orderData.source_tentativa_id
      });

      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert(orderData)
        .select()
        .single();

      if (pedidoError) {
        console.error('❌ [ENHANCED_ORDER_CREATOR] Erro ao inserir pedido:', pedidoError);
        throw new Error(`Erro ao criar pedido: ${pedidoError.message}`);
      }

      // Properly type the returned data with explicit type assertion
      if (!pedidoData) {
        throw new Error('Falha ao criar pedido: dados inválidos retornados');
      }

      const dbResponse = pedidoData as DatabasePedidoResponse;
      
      const pedido: PedidoType = {
        id: dbResponse.id,
        lista_paineis: dbResponse.lista_paineis || [],
        lista_predios: dbResponse.lista_predios || [],
        valor_total: dbResponse.valor_total || 0,
        client_id: dbResponse.client_id
      };

      // VERIFICATION: Log the saved data to confirm it was saved correctly
      console.log('✅ [ENHANCED_ORDER_CREATOR] Pedido criado com sucesso!');
      console.log('📊 [ENHANCED_ORDER_CREATOR] Dados salvos:', {
        id: pedido.id,
        lista_paineis: pedido.lista_paineis,
        lista_predios: pedido.lista_predios,
        valor_total: pedido.valor_total,
        client_id: pedido.client_id,
        source_tentativa_id: sourceTentativaId
      });

      // Coupon usage will be tracked via the cupom_id in pedidos table
      // The get_coupon_usage_details RPC function reads from pedidos table
      if (couponId) {
        console.log('✅ [ENHANCED_ORDER_CREATOR] Cupom vinculado ao pedido:', couponId);
      }

      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        'Pedido criado com dados completos e verificados',
        { 
          orderId: pedido.id,
          totalPrice: correctTotalPrice,
          itemCount: cartItems.length,
          panelIds: panelIds,
          buildingIds: buildingIds,
          savedPanelIds: pedido.lista_paineis,
          savedBuildingIds: pedido.lista_predios,
          transactionId,
          paymentKey,
          sourceTentativaId,
          enhanced: true
        }
      );

      return pedido;

    } catch (error: any) {
      console.error('💥 [ENHANCED_ORDER_CREATOR] Erro fatal:', error);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        'Erro ao criar pedido (versão aprimorada)',
        { 
          error: error.message,
          userId: sessionUser?.id,
          cartItems: cartItems?.map(item => ({
            panelId: item.panel?.id,
            buildingId: item.panel?.building_id,
            panelName: item.panel?.buildings?.nome,
            buildingName: item.panel?.buildings?.nome
          }))
        }
      );
      throw error;
    }
  };

  return { createPaymentOrder };
};
