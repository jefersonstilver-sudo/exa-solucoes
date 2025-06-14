import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PedidoVideoWithVideos, ActiveCampaign } from '@/types/buildingCampaigns';

// Type for pedido from Supabase query
interface PedidoFromQuery {
  id: string;
  client_id: string;
  valor_total: number;
  data_inicio: string;
  data_fim: string;
  status: string;
  plano_meses: number;
  lista_predios: string[];
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

      // Type assertion for pedidos with proper typing
      const typedPedidos = pedidos as PedidoFromQuery[];

      // Buscar dados dos clientes
      const clientIds = typedPedidos.map(p => p.client_id);
      const { data: clients, error: clientsError } = await supabase.auth.admin.listUsers();

      if (clientsError) {
        console.error('❌ [ACTIVE CAMPAIGNS] Erro ao buscar clientes:', clientsError);
      }

      // Buscar vídeos dos pedidos com tipagem explícita
      const pedidoIds = typedPedidos.map(p => p.id);
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

      // Processar dados com type guards explícitos
      const typedVideosData = (videosData || [])
        .filter((item): item is PedidoVideoWithVideos => 
          item !== null && 
          typeof item === 'object' && 
          'id' in item && 
          'pedido_id' in item
        ) as PedidoVideoWithVideos[];

      // Montar dados das campanhas com tipagem segura
      const campaignsData: ActiveCampaign[] = typedPedidos.map((pedido: PedidoFromQuery) => {
        const client = clients?.users?.find(u => u.id === pedido.client_id);
        
        // Filtrar vídeos usando type guard mais explícito
        const pedidoVideos = typedVideosData.filter((videoEntry) => {
          return videoEntry && videoEntry.pedido_id === pedido.id;
        });

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
          videos: pedidoVideos.map((videoEntry) => {
            // Acesso seguro aos dados do vídeo com verificação de null
            const videoData = videoEntry.videos;
            
            return {
              id: videoEntry.id,
              nome: videoData?.nome || 'Vídeo sem nome',
              url: videoData?.url || '',
              approval_status: videoEntry.approval_status || 'pending',
              is_active: videoEntry.is_active || false,
              selected_for_display: videoEntry.selected_for_display || false,
              slot_position: videoEntry.slot_position || 0,
              rejection_reason: videoEntry.rejection_reason
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
