
import { useState, useEffect } from 'react';
import { ActiveCampaign } from './types';
import { fetchActivePedidos, fetchClients, fetchPedidoVideos } from './dataService';
import { processCampaigns } from './campaignProcessor';

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
      // Fetch active pedidos
      const typedPedidos = await fetchActivePedidos(buildingId);

      if (typedPedidos.length === 0) {
        setCampaigns([]);
        return;
      }

      // Fetch clients data
      const clients = await fetchClients();

      // Fetch videos data
      const pedidoIds = typedPedidos.map((p) => p.id);
      const typedVideosData = await fetchPedidoVideos(pedidoIds);

      // Process and set campaigns
      const campaignsData = processCampaigns(typedPedidos, clients, typedVideosData);
      setCampaigns(campaignsData);

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

// Re-export types for convenience
export type { ActiveCampaign } from './types';
