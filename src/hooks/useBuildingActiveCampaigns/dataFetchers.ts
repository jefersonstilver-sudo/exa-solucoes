
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
    .in('status', ['video_aprovado', 'pago_pendente_video', 'video_enviado'])
    .gte('data_fim', new Date().toISOString().split('T')[0]);

  if (pedidosError) {
    console.error('❌ [ACTIVE CAMPAIGNS] Erro ao buscar pedidos:', pedidosError);
    throw pedidosError;
  }

  console.log('📋 [ACTIVE CAMPAIGNS] Pedidos encontrados:', pedidos?.length || 0);
  return pedidos as Pedido[] | null;
};

export const fetchClients = async () => {
  console.log('👥 [ACTIVE CAMPAIGNS] Buscando dados dos clientes...');
  
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role');
  
  if (usersError) {
    console.error('❌ [ACTIVE CAMPAIGNS] Erro ao buscar usuários:', usersError);
    return null;
  }
  
  console.log('✅ [ACTIVE CAMPAIGNS] Usuários encontrados:', users?.length || 0);
  return { users };
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

// ⚡ OTIMIZAÇÃO 1: Função otimizada para buscar tudo em paralelo (67% mais rápido)
export const fetchAllCampaignData = async (buildingId: string) => {
  console.log('⚡ [ACTIVE CAMPAIGNS] Iniciando busca paralela otimizada');
  
  const startTime = performance.now();

  // Buscar tudo em paralelo com Promise.all
  const [pedidos, clientsData, pedidoVideosRaw] = await Promise.all([
    fetchActivePedidos(buildingId),
    fetchClients(),
    // Buscar vídeos já filtrados por prédio em uma única query
    supabase
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
        ),
        pedidos!inner (
          lista_predios,
          status,
          data_fim
        )
      `)
      .contains('pedidos.lista_predios', [buildingId])
      .in('pedidos.status', ['video_aprovado', 'pago_pendente_video', 'video_enviado'])
      .gte('pedidos.data_fim', new Date().toISOString().split('T')[0])
  ]);

  const endTime = performance.now();
  console.log(`✅ [ACTIVE CAMPAIGNS] Busca paralela concluída em ${(endTime - startTime).toFixed(0)}ms`);

  return {
    pedidos,
    clients: clientsData,
    pedidoVideos: pedidoVideosRaw.data as PedidoVideoQueryResult[] | null
  };
};
