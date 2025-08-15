
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
  tentativaId?: string | null;
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
    const { clientId, cartItems, selectedPlan, totalPrice, couponId, tentativaId } = params;
    
    setIsCreating(true);
    
    try {
      // Validações essenciais
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Carrinho vazio - não é possível criar pedido');
      }

      // ATUALIZADO: Permitir valor zero para cupons de 100%
      if (totalPrice < 0) {
        throw new Error('Valor total negativo - não é possível criar pedido');
      }

      // Gerar transaction_id único para rastreamento
      const transactionId = uuidv4();
      
      // CORREÇÃO: Extrair corretamente IDs dos painéis e prédios
      const listaPaineis = cartItems
        .map(item => item.panel?.id)
        .filter(Boolean);
      
      const listaPredios = cartItems
        .map(item => item.panel?.buildings?.id || item.panel?.building_id)
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicados
      
      // Validar se conseguimos extrair os dados
      if (listaPaineis.length === 0) {
        throw new Error('Não foi possível extrair dados dos painéis');
      }

      if (listaPredios.length === 0) {
        throw new Error('Não foi possível extrair dados dos prédios');
      }

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
          lista_predios: listaPredios,
          data_inicio: dataInicio.toISOString().split('T')[0],
          data_fim: dataFim.toISOString().split('T')[0],
          termos_aceitos: true,
          cupom_id: couponId,
          source_tentativa_id: tentativaId,
          log_pagamento: {
            created_via: 'pix_button',
            payment_method: 'pix',
            created_at: new Date().toISOString(),
            transaction_id: transactionId,
            cart_snapshot: cartItems.map(item => ({
              panel_id: item.panel?.id,
              building_id: item.panel?.buildings?.id || item.panel?.building_id,
              building_name: item.panel?.buildings?.nome,
              duration: item.duration
            })),
            price_calculation: {
              plan_months: selectedPlan,
              panel_count: cartItems.length,
              final_price: totalPrice
            }
          }
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar pedido: ${error.message}`);
      }

      // Log do evento no sistema
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'PEDIDO_CREATED_FOR_PIX',
        descricao: `Pedido criado: ID=${pedido.id}, Prédios=${listaPredios.length}, Painéis=${listaPaineis.length}, Valor=${totalPrice}`
      });

      return {
        success: true,
        pedidoId: pedido.id,
        transactionId: pedido.transaction_id
      };

    } catch (error: any) {
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

      return true;
    } catch (error) {
      return false;
    }
  };

  // Nova função para criar pedidos já pagos (cupons 100%)
  const createPaidOrder = async (params: CreateOrderParams): Promise<OrderResult> => {
    const { clientId, cartItems, selectedPlan, couponId, tentativaId } = params;
    
    setIsCreating(true);
    
    try {
      // Validações essenciais
      if (!cartItems || cartItems.length === 0) {
        throw new Error('Carrinho vazio - não é possível criar pedido');
      }

      // Gerar transaction_id único para rastreamento
      const transactionId = uuidv4();
      
      // Extrair IDs dos painéis e prédios
      const listaPaineis = cartItems
        .map(item => item.panel?.id)
        .filter(Boolean);
      
      const listaPredios = cartItems
        .map(item => item.panel?.buildings?.id || item.panel?.building_id)
        .filter(Boolean)
        .filter((id, index, arr) => arr.indexOf(id) === index);
      
      if (listaPaineis.length === 0 || listaPredios.length === 0) {
        throw new Error('Não foi possível extrair dados dos painéis ou prédios');
      }

      // Calcular datas do período
      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setMonth(dataInicio.getMonth() + selectedPlan);

      // Criar pedido diretamente como pago
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .insert({
          client_id: clientId,
          transaction_id: transactionId,
          valor_total: 0.01, // Valor simbólico
          plano_meses: selectedPlan,
          status: 'pago',
          lista_paineis: listaPaineis,
          lista_predios: listaPredios,
          data_inicio: dataInicio.toISOString().split('T')[0],
          data_fim: dataFim.toISOString().split('T')[0],
          termos_aceitos: true,
          cupom_id: couponId,
          source_tentativa_id: tentativaId,
          log_pagamento: {
            created_via: 'free_coupon',
            payment_method: 'free_coupon',
            payment_status: 'approved',
            created_at: new Date().toISOString(),
            transaction_id: transactionId,
            free_order: true,
            coupon_discount: '100%'
          }
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar pedido pago: ${error.message}`);
      }

      return {
        success: true,
        pedidoId: pedido.id,
        transactionId: pedido.transaction_id
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erro desconhecido ao criar pedido pago'
      };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createPendingOrder,
    createPaidOrder,
    updateOrderStatus,
    isCreating
  };
};
