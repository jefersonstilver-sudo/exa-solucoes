
import { ActiveCampaign, Pedido, PedidoVideoQueryResult } from './types';

export const processCampaignsData = (
  pedidos: Pedido[],
  clients: any,
  videosData: PedidoVideoQueryResult[] | null
): ActiveCampaign[] => {
  return pedidos.map(pedido => {
    const client = clients?.users?.find((u: any) => u.id === pedido.client_id);
    
    // Filtrar vídeos para este pedido específico com verificação de tipo
    const pedidoVideos = videosData?.filter((video): video is PedidoVideoQueryResult => {
      return video !== null && video !== undefined && video.pedido_id === pedido.id;
    }) || [];

    return {
      id: pedido.id,
      client_id: pedido.client_id,
      client_email: client?.email || 'Email não encontrado',
      client_name: client?.user_metadata?.full_name || client?.email || 'Nome não encontrado',
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
