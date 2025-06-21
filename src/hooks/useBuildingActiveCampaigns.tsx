
import { useState, useEffect } from 'react';
import { ActiveCampaign } from './useBuildingActiveCampaigns/types';
import { fetchActivePedidos, fetchClients, fetchPedidoVideos } from './useBuildingActiveCampaigns/dataFetchers';
import { processCampaignsData } from './useBuildingActiveCampaigns/dataProcessor';

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
      // Buscar pedidos que incluem este prédio e estão ativos
      const pedidos = await fetchActivePedidos(buildingId);

      if (!pedidos || pedidos.length === 0) {
        setCampaigns([]);
        return;
      }

      // Buscar dados dos clientes
      const clients = await fetchClients();

      // Buscar vídeos dos pedidos
      const pedidoIds = pedidos.map(p => p.id);
      const videosData = await fetchPedidoVideos(pedidoIds);

      // Processar dados das campanhas
      const campaignsData = processCampaignsData(pedidos, clients, videosData);

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
