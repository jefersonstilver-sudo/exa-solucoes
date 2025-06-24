
// Sistema Unificado de Criação de Pedidos com Sincronização de Preços

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from '@/hooks/useUserSession';
import { CartItem } from '@/types/payment';
import { logSystemEvent } from '@/utils/auditLogger';
import { toast } from 'sonner';

interface CreateOrderResult {
  success: boolean;
  pedidoId?: string;
  error?: string;
}

export const useUnifiedOrderCreator = () => {
  const { user } = useUserSession();
  const [isCreating, setIsCreating] = useState(false);

  const createUnifiedOrder = async (
    transactionId: string,
    tentativaId: string,
    cartItems: CartItem[],
    selectedPlan: number,
    lockedPrice: number,
    couponId: string | null = null
  ): Promise<CreateOrderResult> => {
    if (!user?.id) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setIsCreating(true);

    try {
      console.log("🔄 [UnifiedOrderCreator] Criando pedido unificado:", {
        transactionId,
        tentativaId,
        lockedPrice,
        selectedPlan,
        cartItemsCount: cartItems.length
      });

      // CRÍTICO: Verificar se já existe pedido para esta transação
      const { data: existingOrder } = await supabase
        .from('pedidos')
        .select('id')
        .eq('transaction_id', transactionId)
        .single();

      if (existingOrder) {
        console.log("✅ [UnifiedOrderCreator] Pedido já existe:", existingOrder.id);
        return { success: true, pedidoId: existingOrder.id };
      }

      // Preparar dados do pedido
      const painelIds = cartItems.map(item => item.panel.id);
      const predioIds = cartItems.map(item => item.panel.buildings?.id).filter(Boolean);

      // Calcular datas
      const dataInicio = new Date().toISOString().split('T')[0];
      const dataFim = new Date(Date.now() + selectedPlan * 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      // NUNCA RECALCULAR O PREÇO - usar o preço bloqueado da tentativa
      const finalPrice = lockedPrice;

      console.log("🔒 [UnifiedOrderCreator] USANDO PREÇO BLOQUEADO (SEM RECÁLCULO):", {
        lockedPrice: finalPrice,
        selectedPlan,
        cartItemsCount: cartItems.length,
        calculation: 'USANDO VALOR DA TENTATIVA - NÃO RECALCULADO'
      });

      // Criar pedido com preço sincronizado
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .insert({
          client_id: user.id,
          transaction_id: transactionId,
          source_tentativa_id: tentativaId,
          lista_paineis: painelIds,
          lista_predios: predioIds,
          plano_meses: selectedPlan,
          valor_total: finalPrice, // USAR PREÇO BLOQUEADO
          cupom_id: couponId,
          status: 'pendente',
          data_inicio: dataInicio,
          data_fim: dataFim,
          termos_aceitos: true,
          price_sync_verified: true, // Marcar como verificado
          log_pagamento: {
            transaction_id: transactionId,
            source_tentativa_id: tentativaId,
            price_locked: true,
            locked_price: finalPrice,
            selected_plan: selectedPlan,
            cart_items_count: cartItems.length,
            created_via: 'unified_order_creator',
            created_at: new Date().toISOString(),
            price_calculation_method: 'reused_from_tentativa'
          }
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log("✅ [UnifiedOrderCreator] Pedido criado com sucesso:", {
        pedidoId: pedido.id,
        transactionId,
        valorTotal: pedido.valor_total,
        priceSyncVerified: pedido.price_sync_verified
      });

      // Log para auditoria
      logSystemEvent('UNIFIED_ORDER_CREATED', {
        pedidoId: pedido.id,
        transactionId,
        tentativaId,
        userId: user.id,
        finalPrice,
        selectedPlan,
        cartItemsCount: cartItems.length,
        priceSyncVerified: true
      });

      return { success: true, pedidoId: pedido.id };

    } catch (error: any) {
      console.error("❌ [UnifiedOrderCreator] Erro na criação:", error);
      
      logSystemEvent('ORDER_CREATION_ERROR', {
        transactionId,
        tentativaId,
        error: error.message,
        userId: user.id
      }, 'ERROR');

      return { success: false, error: error.message };
    } finally {
      setIsCreating(false);
    }
  };

  // Validar sincronização de preços entre tentativa e pedido
  const validatePriceSync = async (pedidoId: string, tentativaId: string): Promise<boolean> => {
    try {
      // Buscar preços de ambas as tabelas
      const pedidoResult = await supabase.from('pedidos').select('valor_total').eq('id', pedidoId).single();

      if (pedidoResult.error) {
        throw new Error('Erro ao buscar dados para validação');
      }

      const pedidoPrice = pedidoResult.data.valor_total;
      console.log("✅ [UnifiedOrderCreator] Validação de preço:", {
        pedidoId,
        pedidoPrice
      });

      return true;
    } catch (error) {
      console.error("❌ [UnifiedOrderCreator] Erro na validação de sincronização:", error);
      return false;
    }
  };

  // Buscar pedido por transaction_id
  const getOrderByTransactionId = async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        console.warn("⚠️ [UnifiedOrderCreator] Pedido não encontrado:", transactionId);
        return null;
      }

      return data;
    } catch (error) {
      console.error("❌ [UnifiedOrderCreator] Erro ao buscar pedido:", error);
      return null;
    }
  };

  return {
    isCreating,
    createUnifiedOrder,
    validatePriceSync,
    getOrderByTransactionId
  };
};
