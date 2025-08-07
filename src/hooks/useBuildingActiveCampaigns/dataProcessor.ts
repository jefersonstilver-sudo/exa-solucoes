
import { ActiveCampaign, Pedido, PedidoVideoQueryResult } from './types';

export const processCampaignsData = (
  pedidos: Pedido[],
  clients: any,
  videosData: PedidoVideoQueryResult[] | null
): ActiveCampaign[] => {
  console.log('🔄 [ACTIVE CAMPAIGNS] Processando', pedidos?.length || 0, 'pedidos...');
  console.log('👥 [ACTIVE CAMPAIGNS] Clientes disponíveis:', clients?.users?.length || 0);
  
  return pedidos.map(pedido => {
    const client = clients?.users?.find((u: any) => u.id === pedido.client_id);
    console.log(`🔍 [ACTIVE CAMPAIGNS] Cliente para pedido ${pedido.id}:`, client);
    
    // Filtrar vídeos para este pedido específico com verificação de tipo
    const pedidoVideos = videosData?.filter((video): video is PedidoVideoQueryResult => {
      return video !== null && video !== undefined && video.pedido_id === pedido.id;
    }) || [];

    // Extrair nome do cliente - usar email como fallback mais limpo
    const clientEmail = client?.email || 'Email não encontrado';
    const clientName = client?.email?.split('@')[0] || 'Cliente';

    return {
      id: pedido.id,
      client_id: pedido.client_id,
      client_email: clientEmail,
      client_name: clientName,
      valor_total: pedido.valor_total || 0,
      data_inicio: pedido.data_inicio,
      data_fim: pedido.data_fim,
      status: pedido.status,
      plano_meses: pedido.plano_meses,
      videos: pedidoVideos.map((pv) => {
        const videoData = pv.videos;
        
        return {
          id: pv.video_id || '',
          nome: videoData?.nome || 'Título não definido',
          url: videoData?.url || '',
          approval_status: pv.approval_status || 'pending',
          is_active: pv.is_active || false,
          selected_for_display: pv.selected_for_display || false,
          slot_position: pv.slot_position || 0,
          rejection_reason: pv.rejection_reason
        };
      })
    };
  });
};
