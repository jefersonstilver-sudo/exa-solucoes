
import { supabase } from '@/integrations/supabase/client';
import { ensureSpreadable } from '@/utils/priceUtils';
import { Panel } from '@/types/panel';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface OrderCreationOptions {
  sessionUser: any;
  cartItems: CartItem[];
  selectedPlan: number;
  totalPrice: number;
  couponId: string | null;
  startDate: Date;
  endDate: Date;
}

export const useOrderCreation = () => {
  const createOrder = async ({
    sessionUser,
    cartItems,
    selectedPlan,
    totalPrice,
    couponId,
    startDate,
    endDate
  }: OrderCreationOptions) => {
    // Cria uma cópia dos itens do carrinho para evitar problemas se o carrinho for limpo
    const cartItemsCopy = [...cartItems];
    
    // Cria pedido no banco de dados
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([
        {
          client_id: sessionUser.id,
          lista_paineis: cartItemsCopy.map(item => item.panel.id),
          duracao: selectedPlan * 30, // Converte meses para dias
          plano_meses: selectedPlan,
          valor_total: totalPrice,
          cupom_id: couponId,
          data_inicio: startDate.toISOString().split('T')[0],
          data_fim: endDate.toISOString().split('T')[0],
          termos_aceitos: true,
          status: 'pendente',
          log_pagamento: {
            plan_details: { months: selectedPlan },
            coupon_applied: couponId ? true : false,
            panels_count: cartItemsCopy.length,
            user_name: sessionUser.user_metadata?.name || sessionUser.email
          }
        }
      ])
      .select()
      .single();
    
    if (pedidoError) throw pedidoError;
    
    // Se um cupom foi aplicado, registra seu uso
    if (couponId) {
      await supabase
        .from('cupom_usos')
        .insert([
          {
            cupom_id: couponId,
            user_id: sessionUser.id,
            pedido_id: pedido.id
          }
        ]);
    }
    
    // Atualiza o pedido com informações de pagamento
    await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          ...ensureSpreadable(pedido.log_pagamento),
          payment_preference_id: 'TEST-PREFERENCE-ID'
        }
      })
      .eq('id', pedido.id);
      
    return pedido;
  };

  return { createOrder };
};
