import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CampaignAdvanced } from '@/types/campaignScheduling';

interface OldCampaign {
  id: string;
  painel_id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  obs?: string;
  created_at: string;
  video_id: string;
}

export interface UnifiedCampaign {
  id: string;
  name: string;
  type: 'advanced' | 'legacy';
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  description?: string;
  pedido_id?: string;
  painel_id?: string;
  video_id?: string;
}

export const useUnifiedCampaigns = () => {
  const { userProfile } = useAuth();
  const [campaigns, setCampaigns] = useState<UnifiedCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCampaigns = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar campanhas avançadas
      const { data: advancedCampaigns, error: advancedError } = await supabase
        .from('campaigns_advanced')
        .select('*')
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (advancedError) throw advancedError;

      // Buscar campanhas legadas
      const { data: legacyCampaigns, error: legacyError } = await supabase
        .from('campanhas')
        .select('*')
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (legacyError) throw legacyError;

      // Converter campanhas avançadas
      const unifiedAdvanced: UnifiedCampaign[] = (advancedCampaigns || []).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        type: 'advanced' as const,
        status: campaign.status,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        created_at: campaign.created_at,
        description: campaign.description,
        pedido_id: campaign.pedido_id
      }));

      // Converter campanhas legadas
      const unifiedLegacy: UnifiedCampaign[] = (legacyCampaigns || []).map((campaign: OldCampaign) => ({
        id: campaign.id,
        name: `Campanha ${campaign.id.substring(0, 8)}`,
        type: 'legacy' as const,
        status: campaign.status,
        start_date: campaign.data_inicio,
        end_date: campaign.data_fim,
        created_at: campaign.created_at,
        description: campaign.obs,
        painel_id: campaign.painel_id,
        video_id: campaign.video_id
      }));

      // Combinar e ordenar por data de criação
      const allCampaigns = [...unifiedAdvanced, ...unifiedLegacy].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setCampaigns(allCampaigns);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCampaigns();
  }, [userProfile?.id]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchAllCampaigns
  };
};