
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface CreateOrderParams {
  clientId: string;
  cartItems: any[];
  selectedPlan: number;
  totalPrice: number;
  couponId?: string | null;
}

interface OrderResult {
  success: boolean;
  pedidoId?: string;
  transactionId?: string;
  error?: string;
}

export const useOrderManager = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createPendingOrder = async (params: CreateOrderParams): Promise<OrderResult> => {
    const { clientId, cartItems, selectedPlan, totalPrice, couponId } = params;
    
    setIsCreating(true);
    
    try {
      // Gerar transaction_id único para rastreamento
      const transactionId = uuidv4();
      
      // Extrair informações dos prédios/painéis selecionados
      const listaPaineis = cartItems.map(item => item.panel?.id || item.id).filter(Boolean);
      const listaPredios = cartItems.map(item => item.panel?.building_id || item.panel?.buildings?.id).filter(Boolean);
      
      console.log("🏗️ [OrderManager] Criando pedido pendente:", {
        clientId,
        transactionId,
        totalPrice,
        selectedPlan,
        listaPaineis,
        listaPredios: [...new Set(listaPredios)] // Remove duplicados
      });

      // Calcular datas do período
      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setMonth(dataInicio.getMonth() + selectedPlan);

      // Criar pedido na tabela pedidos
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .insert({
          client_id: clientId,
          transaction_id: transactionId,
          valor_total: totalPrice,
          plano_meses: selectedPlan,
          status: 'pendente',
          lista_paineis: listaPaineis,
          lista_predios: [...new Set(listaPredios)],
          data_inicio: dataInicio.toISOString().split('T')[0],
          data_fim: dataFim.toISOString().split('T')[0],
          termos_aceitos: true,
          cupom_id: couponId,
          log_pagamento: {
            created_via: 'pix_button',
            payment_method: 'pix',
            created_at: new Date().toISOString(),
            transaction_id: transactionId,
            cart_snapshot: cartItems,
            price_breakdown: {
              base_price: totalPrice / 0.95, // Preço sem desconto PIX
              pix_discount: totalPrice * 0.05,
              final_price: totalPrice
            }
          }
        })
        .select()
        .single();

      if (error) {
        console.error("❌ [OrderManager] Erro ao criar pedido:", error);
        throw new Error(`Erro ao criar pedido: ${error.message}`);
      }

      console.log("✅ [OrderManager] Pedido criado com sucesso:", {
        pedidoId: pedido.id,
        transactionId: pedido.transaction_id,
        status: pedido.status
      });

      // Log do evento no sistema
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'PEDIDO_CREATED_FOR_PIX',
        descricao: `Pedido criado para PIX: ID=${pedido.id}, Transaction=${transactionId}, Valor=${totalPrice}`
      });

      return {
        success: true,
        pedidoId: pedido.id,
        transactionId: pedido.transaction_id
      };

    } catch (error: any) {
      console.error("❌ [OrderManager] Erro no processo:", error);
      
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao criar pedido'
      };
    } finally {
      setIsCreating(false);
    }
  };

  const updateOrderStatus = async (pedidoId: string, newStatus: string, additionalData?: any) => {
    try {
      const updateData: any = {
        status: newStatus,
        log_pagamento: additionalData ? { ...additionalData } : undefined
      };

      const { error } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', pedidoId);

      if (error) throw error;

      console.log("✅ [OrderManager] Status do pedido atualizado:", {
        pedidoId,
        newStatus
      });

      return true;
    } catch (error) {
      console.error("❌ [OrderManager] Erro ao atualizar status:", error);
      return false;
    }
  };

  return {
    createPendingOrder,
    updateOrderStatus,
    isCreating
  };
};
