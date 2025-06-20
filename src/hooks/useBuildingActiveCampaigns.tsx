
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActiveCampaign {
  id: string;
  client_id: string;
  client_email: string;
  client_name: string;
  valor_total: number;
  data_inicio: string;
  data_fim: string;
  status: string;
  plano_meses: number;
  videos: {
    id: string;
    nome: string;
    url: string;
    approval_status: string;
    is_active: boolean;
    selected_for_display: boolean;
    slot_position: number;
    rejection_reason?: string;
  }[];
}

interface VideoData {
  id: string;
  nome: string;
  url: string;
}

interface PedidoVideoQueryResult {
  id: string;
  pedido_id: string;
  video_id: string | null;
  approval_status: string;
  is_active: boolean;
  selected_for_display: boolean;
  slot_position: number;
  rejection_reason?: string;
  videos: VideoData | null;
}

export const useBuildingActiveCampaigns = (buildingId: string) => {
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveCampaigns = async () => {
    if (!buildingId) {
      console.warn('❌ [ACTIVE CAMPAIGNS] Building ID é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🎬 [ACTIVE CAMPAIGNS] Buscando campanhas ativas para prédio:', buildingId);

      // Buscar pedidos que incluem este prédio e estão ativos
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
        .gte('data_fim', new Date().toISOString().split('T')[0]); // Só campanhas não expiradas

      if (pedidosError) {
        console.error('❌ [ACTIVE CAMPAIGNS] Erro ao buscar pedidos:', pedidosError);
        throw pedidosError;
      }

      console.log('📋 [ACTIVE CAMPAIGNS] Pedidos encontrados:', pedidos?.length || 0);

      if (!pedidos || pedidos.length === 0) {
        setCampaigns([]);
        return;
      }

      // Buscar dados dos clientes
      const clientIds = pedidos.map(p => p.client_id);
      const { data: clients, error: clientsError } = await supabase.auth.admin.listUsers();

      if (clientsError) {
        console.error('❌ [ACTIVE CAMPAIGNS] Erro ao buscar clientes:', clientsError);
      }

      // Buscar vídeos dos pedidos
      const pedidoIds = pedidos.map(p => p.id);
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

      // Type the videos data properly
      const typedVideosData = (videosData || []) as PedidoVideoQueryResult[];

      console.log('🎥 [ACTIVE CAMPAIGNS] Vídeos encontrados:', typedVideosData?.length || 0);

      // Montar dados das campanhas
      const campaignsData: ActiveCampaign[] = pedidos.map(pedido => {
        const client = clients?.users?.find(u => u.id === pedido.client_id);
        
        // CORREÇÃO CRÍTICA: Tipagem explícita para evitar tipo 'never'
        const pedidoVideos: PedidoVideoQueryResult[] = (typedVideosData || []).filter(
          (v: PedidoVideoQueryResult) => v.pedido_id === pedido.id
        );

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
          videos: pedidoVideos.map((pv: PedidoVideoQueryResult) => {
            // CORREÇÃO CRÍTICA: Usar video_id como ID principal, com fallback para o ID do pedido_video
            const videoId: string = pv.video_id || pv.id;
            const videoData = pv.videos;
            
            return {
              id: videoId,
              nome: videoData?.nome || 'Vídeo sem nome',
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

      setCampaigns(campaignsData);
      console.log('✅ [ACTIVE CAMPAIGNS] Campanhas processadas:', campaignsData.length);

    } catch (error: any) {
      console.error('💥 [ACTIVE CAMPAIGNS] Erro geral:', error);
      setError(error.message || 'Erro ao carregar campanhas ativas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (buildingId) {
      fetchActiveCampaigns();
    }
  }, [buildingId]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchActiveCampaigns
  };
};
