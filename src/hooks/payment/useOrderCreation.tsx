
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
    // Validate panel IDs are proper UUIDs
    const validPanelIds = cartItems
      .filter(item => 
        item.panel.id && 
        typeof item.panel.id === 'string' && 
        item.panel.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      )
      .map(item => item.panel.id);
    
    if (validPanelIds.length !== cartItems.length) {
      throw new Error('Alguns painéis possuem identificadores inválidos');
    }
    
    // Cria uma cópia dos itens do carrinho para evitar problemas se o carrinho for limpo
    const cartItemsCopy = [...cartItems];
    
    // Cria pedido no banco de dados
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([
        {
          client_id: sessionUser.id,
          lista_paineis: validPanelIds,
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
            user_name: sessionUser.user_metadata?.name || sessionUser.email,
            payment_method: 'mercado_pago'
          }
        }
      ])
      .select()
      .single();
    
    if (pedidoError) {
      console.error('Erro ao criar pedido:', pedidoError);
      throw pedidoError;
    }
    
    // Se um cupom foi aplicado, registra seu uso
    if (couponId) {
      try {
        await supabase
          .from('cupom_usos')
          .insert([
            {
              cupom_id: couponId,
              user_id: sessionUser.id,
              pedido_id: pedido.id
            }
          ]);
      } catch (error) {
        console.error('Erro ao registrar uso do cupom:', error);
        // Não impedimos o fluxo se o registro do cupom falhar
      }
    }
    
    // Atualiza o pedido com informações adicionais
    try {
      await supabase
        .from('pedidos')
        .update({
          log_pagamento: {
            ...ensureSpreadable(pedido.log_pagamento),
            order_created_at: new Date().toISOString(),
            order_source: 'web_checkout',
            client_email: sessionUser.email
          }
        })
        .eq('id', pedido.id);
    } catch (updateError) {
      console.error('Erro ao atualizar informações adicionais do pedido:', updateError);
      // Não impedimos o fluxo se a atualização falhar
    }
      
    return pedido;
  };
  
  // Função para criar campanhas após pagamento confirmado
  const createCampaignsAfterPayment = async (pedidoId: string, userId: string) => {
    try {
      // Buscar detalhes do pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();
      
      if (pedidoError) {
        console.error('Erro ao buscar detalhes do pedido:', pedidoError);
        throw pedidoError;
      }
      
      // Atualizar status do pedido para 'pago'
      await supabase
        .from('pedidos')
        .update({ status: 'pago' })
        .eq('id', pedidoId);
      
      // Buscar vídeo ativo do cliente (se houver)
      const { data: videos, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('client_id', userId)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Determinar se o cliente tem um vídeo ou precisa cadastrar um
      const videoId = videos && videos.length > 0 ? videos[0].id : null;
      
      // Criar campanhas para cada painel do pedido
      const campanhasInsert = pedido.lista_paineis.map((painelId: string) => ({
        client_id: userId,
        video_id: videoId,
        painel_id: painelId,
        data_inicio: pedido.data_inicio,
        data_fim: pedido.data_fim,
        status: videoId ? 'pendente' : 'aguardando_video',
        obs: `Criado a partir do pedido ${pedidoId}`
      }));
      
      // Inserir campanhas no banco de dados
      if (campanhasInsert.length > 0) {
        const { error: campanhasError } = await supabase
          .from('campanhas')
          .insert(campanhasInsert);
        
        if (campanhasError) {
          console.error('Erro ao criar campanhas:', campanhasError);
          throw campanhasError;
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao processar pós-pagamento:', error);
      return { success: false, error };
    }
  };

  return { 
    createOrder,
    createCampaignsAfterPayment
  };
};
