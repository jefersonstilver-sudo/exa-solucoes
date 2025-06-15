
import { supabase } from '@/integrations/supabase/client';
import { PedidoQueryResult, PedidoVideoQueryResult, AuthUser } from './types';

export const fetchActivePedidos = async (buildingId: string): Promise<PedidoQueryResult[]> => {
  console.log('🎬 [ACTIVE CAMPAIGNS] Buscando campanhas ativas para prédio:', buildingId);

  const { data: pedidos, error: pedidosError } = await supabase
    .from('pedidos')
    .select(`
      id,
      client_id,
      valor_total,
      data_inicio,
      data_fim,
      status,
      plano_meses,
      lista_predios
    `)
    .contains('lista_predios', [buildingId])
    .in('status', ['ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado'])
    .gte('data_fim', new Date().toISOString().split('T')[0]);

  if (pedidosError) {
    console.error('❌ [ACTIVE CAMPAIGNS] Erro ao buscar pedidos:', pedidosError);
    throw pedidosError;
  }

  console.log('📋 [ACTIVE CAMPAIGNS] Pedidos encontrados:', pedidos?.length || 0);
  return (pedidos || []) as PedidoQueryResult[];
};

export const fetchClients = async (): Promise<AuthUser[]> => {
  const { data: clientsResponse, error: clientsError } = await supabase.auth.admin.listUsers();

  if (clientsError) {
    console.error('❌ [ACTIVE CAMPAIGNS] Erro ao buscar clientes:', clientsError);
  }

  return clientsResponse?.users || [];
};

export const fetchPedidoVideos = async (pedidoIds: string[]): Promise<PedidoVideoQueryResult[]> => {
  const { data: videosData, error: videosError } = await supabase
    .from('pedido_videos')
    .select(`
      id,
      pedido_id,
      video_id,
      approval_status,
      is_active,
      selected_for_display,
      slot_position,
      rejection_reason,
      videos (
        id,
        nome,
        url
      )
    `)
    .in('pedido_id', pedidoIds);

  if (videosError) {
    console.error('❌ [ACTIVE CAMPAIGNS] Erro ao buscar vídeos:', videosError);
    throw videosError;
  }

  return Array.isArray(videosData) 
    ? videosData.map(item => ({
        id: item.id,
        pedido_id: item.pedido_id,
        video_id: item.video_id,
        approval_status: item.approval_status,
        is_active: item.is_active,
        selected_for_display: item.selected_for_display,
        slot_position: item.slot_position,
        rejection_reason: item.rejection_reason,
        videos: item.videos
      }))
    : [];
};
