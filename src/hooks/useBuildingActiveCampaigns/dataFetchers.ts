
import { supabase } from '@/integrations/supabase/client';
import { Pedido, PedidoVideoQueryResult } from './types';

export const fetchActivePedidos = async (buildingId: string) => {
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
  return pedidos as Pedido[] | null;
};

export const fetchClients = async () => {
  const { data: clients, error: clientsError } = await supabase.auth.admin.listUsers();
  
  if (clientsError) {
    console.error('❌ [ACTIVE CAMPAIGNS] Erro ao buscar clientes:', clientsError);
  }
  
  return clients;
};

export const fetchPedidoVideos = async (pedidoIds: string[]) => {
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

  console.log('🎥 [ACTIVE CAMPAIGNS] Vídeos encontrados:', videosData?.length || 0);
  return videosData as PedidoVideoQueryResult[] | null;
};
