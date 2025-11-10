
import { supabase } from '@/integrations/supabase/client';
import { prepareForInsert, prepareForUpdate, filterEq } from '@/utils/supabaseUtils';
import { processExternalClientCreation } from '@/services/externalClientService';
import { logSystemEvent } from '@/utils/auditLogger';

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
      
      // Processar criação de cliente externo na primeira compra aprovada
      logSystemEvent('PAYMENT_APPROVED_PROCESSING_EXTERNAL_CLIENT', {
        pedidoId,
        userId,
        orderValue: orderData.valor_total
      });
      
      const externalClientResult = await processExternalClientCreation(userId);
      
      if (externalClientResult.attempted) {
        if (externalClientResult.success) {
          logSystemEvent('EXTERNAL_CLIENT_CREATION_COMPLETED', {
            pedidoId,
            userId,
            success: true
          });
        } else {
          logSystemEvent('EXTERNAL_CLIENT_CREATION_FAILED', {
            pedidoId,
            userId,
            error: externalClientResult.error
          }, 'WARNING');
        }
      }
      
      // 🔒 CRITICAL FIX: Criar apenas UMA campanha por pedido, não uma por painel
      // Os painéis já estão vinculados ao pedido via lista_paineis
      const panelIds = Array.isArray(orderData.lista_paineis)
        ? orderData.lista_paineis 
        : [orderData.lista_paineis];
      
      if (!panelIds || panelIds.length === 0) {
        throw new Error('Nenhum painel encontrado no pedido');
      }

      // ✅ CORRIGIDO: Criar apenas UMA campanha vinculada ao pedido
      // O primeiro painel será usado como referência principal
      const mainPanelId = panelIds[0];
      
      console.log(`📋 [CAMPAIGN_CREATOR] Criando UMA campanha para pedido ${pedidoId} com ${panelIds.length} painéis`);
      
      const campaignData = prepareForInsert({
        client_id: userId,
        painel_id: mainPanelId, // Painel principal (primeiro da lista)
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
      
      console.log(`✅ [CAMPAIGN_CREATOR] UMA campanha criada com sucesso para ${panelIds.length} painéis`);
      
      return { success: true, message: 'Campanhas criadas com sucesso' };
    } catch (error: any) {
      console.error('Erro ao processar pós-pagamento:', error);
      return { success: false, error: error.message };
    }
  };

  return { createCampaignsAfterPayment };
};
