
import { ActiveCampaign, PedidoQueryResult, PedidoVideoQueryResult, AuthUser } from './types';

export const processCampaigns = (
  pedidos: PedidoQueryResult[],
  clients: AuthUser[],
  videosData: PedidoVideoQueryResult[]
): ActiveCampaign[] => {
  console.log('🎥 [ACTIVE CAMPAIGNS] Vídeos encontrados:', videosData.length);

  const campaignsData: ActiveCampaign[] = [];
  
  for (const pedido of pedidos) {
    const client = clients.find((u: AuthUser) => u.id === pedido.client_id);
    
    // Filter videos for this specific pedido
    const pedidoVideos = videosData.filter(pv => pv.pedido_id === pedido.id);

    const campaign: ActiveCampaign = {
      id: pedido.id,
      client_id: pedido.client_id,
      client_email: client?.email || 'Email não encontrado',
      client_name: client?.user_metadata?.full_name || client?.email || 'Nome não encontrado',
      valor_total: pedido.valor_total || 0,
      data_inicio: pedido.data_inicio,
      data_fim: pedido.data_fim,
      status: pedido.status,
      plano_meses: pedido.plano_meses,
      videos: pedidoVideos.map(pv => {
        // Use fallback logic to get the video ID safely
        const videoId = pv.videos?.id || pv.video_id || pv.id;
        
        return {
          id: videoId,
          nome: pv.videos?.nome || 'Vídeo sem nome',
          url: pv.videos?.url || '',
          approval_status: pv.approval_status || 'pending',
          is_active: pv.is_active || false,
          selected_for_display: pv.selected_for_display || false,
          slot_position: pv.slot_position || 0,
          rejection_reason: pv.rejection_reason
        };
      })
    };
    
    campaignsData.push(campaign);
  }

  console.log('✅ [ACTIVE CAMPAIGNS] Campanhas processadas:', campaignsData.length);
  return campaignsData;
};
