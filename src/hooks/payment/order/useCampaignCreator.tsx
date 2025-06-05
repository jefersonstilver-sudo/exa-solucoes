
import { supabase } from '@/integrations/supabase/client';
import { prepareForInsert, prepareForUpdate, filterEq } from '@/utils/supabaseUtils';

export const useCampaignCreator = () => {
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

  return { createCampaignsAfterPayment };
};
