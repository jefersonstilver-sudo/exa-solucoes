import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendPixPaymentWebhook } from '@/services/pixWebhookService';
import { PixWebhookData, PixWebhookResponse } from '@/types/pixWebhook';
import { toast } from 'sonner';

export const usePixForPendingOrder = () => {
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

  const generatePixForOrder = async (orderId: string): Promise<PixWebhookResponse | null> => {
    if (isGeneratingPix) return null;
    
    setIsGeneratingPix(true);
    
    try {
      console.log('[usePixForPendingOrder] Gerando PIX para pedido:', orderId);
      
      // Buscar dados do pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', orderId)
        .single();
      
      console.log('[usePixForPendingOrder] Dados do pedido:', pedido, 'Error:', pedidoError);
      
      if (pedidoError || !pedido) {
        throw new Error('Pedido não encontrado');
      }
      
      if (pedido.status !== 'pendente') {
        throw new Error('Este pedido não está pendente de pagamento');
      }
      
      // Buscar dados do cliente
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', pedido.client_id)
        .single();
      
      console.log('[usePixForPendingOrder] Dados do usuário:', userData, 'Error:', userError);
      
      if (userError || !userData) {
        throw new Error('Dados do cliente não encontrados');
      }
      
      // Buscar dados dos prédios selecionados
      const prediosIds = pedido.lista_predios || pedido.lista_paineis || [];
      console.log('[usePixForPendingOrder] IDs dos prédios:', prediosIds);
      
      if (!prediosIds || prediosIds.length === 0) {
        throw new Error('Nenhum prédio selecionado no pedido');
      }
      
      const { data: prediosData, error: prediosError } = await supabase
        .from('buildings')
        .select('id, nome, preco_base')
        .in('id', prediosIds);
      
      console.log('[usePixForPendingOrder] Dados dos prédios:', prediosData, 'Error:', prediosError);
      
      if (prediosError || !prediosData?.length) {
        console.error('[usePixForPendingOrder] Erro ao buscar prédios:', prediosError);
        throw new Error('Dados dos prédios não encontrados');
      }
      
      // Validar dados obrigatórios
      if (!pedido.plano_meses) {
        throw new Error('Plano de meses não definido no pedido');
      }
      
      if (!pedido.valor_total) {
        throw new Error('Valor total não definido no pedido');
      }
      
      // Montar dados para o webhook
      const webhookData: PixWebhookData = {
        cliente_id: pedido.client_id,
        pedido_id: pedido.id,
        email: userData.email,
        nome: userData.email.split('@')[0], // Usar parte do email como nome
        plano_escolhido: `${pedido.plano_meses} meses`,
        periodo_meses: pedido.plano_meses,
        valor_total: pedido.valor_total.toString(),
        predios_selecionados: prediosData.map(predio => ({
          id: predio.id,
          nome: predio.nome
        })),
        periodo_exibicao: {
          inicio: pedido.data_inicio || new Date().toISOString().split('T')[0],
          fim: pedido.data_fim || new Date(Date.now() + (pedido.plano_meses * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
        }
      };
      
      console.log('[usePixForPendingOrder] Dados para webhook:', webhookData);
      
      // Chamar webhook para gerar PIX
      const pixResponse = await sendPixPaymentWebhook(webhookData);
      
      if (!pixResponse.success) {
        throw new Error(pixResponse.error || 'Erro ao gerar PIX');
      }
      
      console.log('[usePixForPendingOrder] PIX gerado com sucesso:', pixResponse);
      
      return pixResponse;
      
    } catch (error: any) {
      console.error('[usePixForPendingOrder] Erro:', error);
      toast.error(error.message || 'Erro ao gerar PIX');
      return null;
    } finally {
      setIsGeneratingPix(false);
    }
  };
  
  return {
    generatePixForOrder,
    isGeneratingPix
  };
};